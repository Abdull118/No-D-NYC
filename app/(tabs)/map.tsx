import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLocation from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { locations, locationTypes, type LocationInfo } from '@/data/locations';
import { showLocation } from 'react-native-map-link';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWJkdWxsMTE4IiwiYSI6ImNsNXhyYmNwbjA5bHIzY3J6aGM0N3U2cWkifQ.6iy9G49UGoRv3r6RGR_BiQ';

function getMapboxStaticImageUrl({ locations, zoom = 12, width = 600, height = 400 }: { locations: LocationInfo[]; zoom?: number; width?: number; height?: number }) {
  // Build marker overlays for each location
  const markers = locations.map((loc: LocationInfo) => `pin-s+ff4b4b(${loc.coordinates.longitude},${loc.coordinates.latitude})`).join(',');
  // Center on the first location or NYC if none
  const center = locations.length > 0
    ? `${locations[0].coordinates.longitude},${locations[0].coordinates.latitude},${zoom}`
    : `-74.0060,40.7128,${zoom}`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markers}/${center}/${width}x${height}?access_token=${MAPBOX_TOKEN}`;
}

const DEVICE_ID_KEY = 'device-unique-id';
const USER_CLICKS_KEY = 'user-pin-clicks';

async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuid.v4() as string;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function recordPinClick(pin: LocationInfo, userId: string) {
  // pin: LocationInfo, userId: string
  const raw = await AsyncStorage.getItem(USER_CLICKS_KEY);
  let data = raw ? JSON.parse(raw) : {};
  if (!data[userId]) data[userId] = {};
  const pinKey = pin.id;
  if (!data[userId][pinKey]) {
    data[userId][pinKey] = {
      pinInfo: {
        id: pin.id,
        name: pin.name,
        address: pin.address,
        coordinates: pin.coordinates,
        type: pin.type,
      },
      clickCount: 0,
      timestamps: [],
    };
  }
  data[userId][pinKey].clickCount += 1;
  data[userId][pinKey].timestamps.push(Date.now());
  await AsyncStorage.setItem(USER_CLICKS_KEY, JSON.stringify(data));
}

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const location = await ExpoLocation.getCurrentPositionAsync({});
      setUserLocation(location);
    })();
  }, []);

  useEffect(() => {
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setOffline(!state.isConnected || !state.isInternetReachable);
    };
    check();
    // Optionally, add a listener for network changes
  }, []);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const handleLocationSelect = async (location: LocationInfo) => {
    setSelectedLocation(location);
    mapRef.current?.animateToRegion(
      {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
    if (deviceId) {
      await recordPinClick(location, deviceId);
    }
  };

  const openDirections = (location: LocationInfo) => {
    showLocation({
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      title: location.name,
      // Optionally, you can add:
      // directionsMode: 'walk', // or 'car', 'public-transport', 'bike'
      // dialogTitle: 'Open in Maps',
      // dialogMessage: 'Choose an app to get directions',
      // cancelText: 'Cancel',
    });
  };

  const filteredLocations = selectedType
    ? locations.filter(location => location.type === selectedType)
    : locations;

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  if (offline) {
    // Show static map image with pins
    const staticUrl = getMapboxStaticImageUrl({ locations: filteredLocations, zoom: 12, width: 600, height: 400 });
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={{ uri: staticUrl }}
            style={{ width: 300, height: 200, borderRadius: 16 }}
            resizeMode="cover"
          />
          <Text style={{ color: '#fff', marginTop: 16, textAlign: 'center' }}>
            Offline: Showing static map. Connect to the internet for interactive map features.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Help Nearby</Text>
        <Text style={styles.headerSubtitle}>
          Locate services in NYC
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.legendContainer}
        contentContainerStyle={styles.legend}>
        <TouchableOpacity
          style={[styles.legendItem, !selectedType && styles.legendItemSelected]}
          onPress={() => setSelectedType(null)}>
          <Text style={styles.legendText}>All</Text>
        </TouchableOpacity>
        {Object.entries(locationTypes).map(([key, value]) => {
          const Icon = value.icon;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.legendItem,
                selectedType === key && styles.legendItemSelected,
                { backgroundColor: value.color + '20' },
              ]}
              onPress={() => setSelectedType(key === selectedType ? null : key)}>
              <Icon size={20} color={value.color} />
              <Text style={[styles.legendText, { color: value.color }]}>
                {value.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={userLocation ? {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          } : DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton>
          {filteredLocations.map((location) => {
            const type = locationTypes[location.type];
            const Icon = type.icon;
            return (
              <Marker
                key={location.id}
                coordinate={location.coordinates}
                onPress={() => handleLocationSelect(location)}>
                <View style={[styles.marker, { backgroundColor: type.color }]}>
                  <Icon color="white" size={20} />
                </View>
              </Marker>
            );
          })}
        </MapView>

        {selectedLocation && (
          <View style={styles.locationCard}>
            <LinearGradient
              colors={['#2D3748', '#1A202C']}
              style={styles.cardGradient}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.locationName}>{selectedLocation.name}</Text>
                  <Text style={styles.locationType}>
                    {locationTypes[selectedLocation.type].name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedLocation(null)}
                  accessibilityLabel="Close card"
                  style={styles.closeButton}
                >
                  <X color="#A0AEC0" size={22} />
                </TouchableOpacity>
              </View>
              <Text style={styles.locationAddress}>
                {selectedLocation.address}
              </Text>
              {selectedLocation.services && (
                <View style={styles.servicesList}>
                  {selectedLocation.services.map((service, index) => (
                    <Text key={index} style={styles.serviceItem}>
                      • {service}
                    </Text>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => openDirections(selectedLocation)}>
                <Navigation color="white" size={20} />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#A0AEC0',
  },
  legendContainer: {
    maxHeight: 50,
    paddingHorizontal: 20,
  },
  legend: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  legendItemSelected: {
    backgroundColor: '#ffffff20',
  },
  legendText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#E2E8F0',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  marker: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    color: '#FF4B4B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  locationCard: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
  },
  locationName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: 'white',
    marginBottom: 4,
  },
  locationType: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#A0AEC0',
  },
  locationAddress: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 12,
  },
  servicesList: {
    marginBottom: 12,
  },
  serviceItem: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  directionsText: {
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});