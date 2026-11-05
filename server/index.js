const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

function loadEnv(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}

const envFile = path.join(__dirname, '..', 'atlas-credentials.env');
if (fs.existsSync(envFile)) loadEnv(envFile);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}
const client = new MongoClient(uri);
const port = Number(process.env.PORT || 8787);

function valid(row) {
  if (!row || typeof row !== 'object') return false;
  if (typeof row.device_id !== 'string' || row.device_id.length < 8 || row.device_id.length > 64) return false;
  if (typeof row.pin_id !== 'string' || row.pin_id.length < 1 || row.pin_id.length > 120) return false;
  if (row.city != null && typeof row.city !== 'string') return false;
  if (row.pin_type != null && typeof row.pin_type !== 'string') return false;
  if (typeof row.directions !== 'boolean') return false;
  if (
    row.distance_km != null &&
    (typeof row.distance_km !== 'number' || row.distance_km < 0 || row.distance_km > 20000)
  ) {
    return false;
  }
  return true;
}

function doc(row) {
  const created = new Date(row.created_at || Date.now());
  return {
    device_id: row.device_id,
    pin_id: row.pin_id,
    city: typeof row.city === 'string' ? row.city : '',
    pin_type: typeof row.pin_type === 'string' ? row.pin_type : '',
    directions: row.directions,
    distance_km: row.distance_km == null ? null : row.distance_km,
    created_at: Number.isNaN(created.getTime()) ? new Date() : created,
  };
}

async function main() {
  await client.connect();
  const col = client.db('nod').collection('pin_activity');
  await col.createIndex({ pin_id: 1, created_at: -1 });
  await col.createIndex({ device_id: 1, created_at: -1 });

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    const pathname = (req.url || '').split('?')[0];
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'GET' && pathname === '/pin-activity') {
      try {
        const rows = await col.find({}).sort({ created_at: 1 }).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows.map((row) => ({
          id: String(row._id),
          device_id: row.device_id,
          pin_id: row.pin_id,
          city: row.city,
          pin_type: row.pin_type,
          directions: row.directions,
          distance_km: row.distance_km,
          created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        }))));
      } catch {
        res.writeHead(500);
        res.end();
      }
      return;
    }
    if (req.method !== 'POST' || pathname !== '/pin-activity') {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const rows = (Array.isArray(body) ? body : [body]).filter(valid).map(doc);
      if (rows.length === 0) {
        res.writeHead(400);
        res.end();
        return;
      }
      await col.insertMany(rows);
      res.writeHead(204);
      res.end();
    } catch {
      res.writeHead(400);
      res.end();
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`listening on ${port}`);
  });
}

main().catch((error) => {
  const message = String(error && error.message ? error.message : error).replace(
    /mongodb(\+srv)?:\/\/[^@\s]+@/g,
    'mongodb$1://***@'
  );
  console.error(message);
  process.exit(1);
});
