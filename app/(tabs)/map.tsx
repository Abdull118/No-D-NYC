import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoLocation from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { locations, locationTypes, type LocationInfo } from '@/data/locations';
import { showLocation } from 'react-native-map-link';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.0060,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Function to calculate region that includes all locations
const calculateBoundsRegion = (locations: LocationInfo[]) => {
  if (locations.length === 0) return DEFAULT_REGION;
  
  const latitudes = locations.map(loc => loc.coordinates.latitude);
  const longitudes = locations.map(loc => loc.coordinates.longitude);
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  const latDelta = Math.abs(maxLat - minLat) * 1.2; // Add 20% padding
  const lngDelta = Math.abs(maxLng - minLng) * 1.2; // Add 20% padding
  
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
    longitudeDelta: Math.max(lngDelta, 0.01), // Minimum zoom level
  };
};

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
  const [initialRegion, setInitialRegion] = useState(() => calculateBoundsRegion(locations));
  const mapRef = useRef<MapView | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [useFallbackTiles, setUseFallbackTiles] = useState(false);

  const filteredLocations = selectedType
    ? locations.filter(location => location.type === selectedType)
    : locations;

  useEffect(() => {
    let mounted = true;
    let locationTimeout: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (!mounted) return;
        
        if (status !== 'granted') {
          setErrorMsg('Location permission denied - showing default NYC area');
          setIsLoading(false);
          setHasLocationPermission(false);
          return;
        }
        
        setHasLocationPermission(true);
        // Show the map while we continue to resolve the user's position
        setIsLoading(false);
        locationTimeout = setTimeout(() => {
          if (mounted) {
            setErrorMsg(prev => prev ?? 'Using NYC area while we determine your location');
          }
        }, 8000);
        
        try {
          const location = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          });
          if (mounted) {
            setUserLocation(location);
            // Keep initial region showing all pins - don't change region on user location
          }
          if (locationTimeout) {
            clearTimeout(locationTimeout);
            locationTimeout = null;
          }
        } catch (locationError) {
          console.warn('Could not get user location:', locationError);
          if (mounted) {
            setErrorMsg('Could not get location - showing default NYC area');
          }
          if (locationTimeout) {
            clearTimeout(locationTimeout);
          }
        }
      } catch (error) {
        console.error('Location permission error:', error);
        if (mounted) {
          setErrorMsg('Location error - showing default NYC area');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        if (locationTimeout) {
          clearTimeout(locationTimeout);
          locationTimeout = null;
        }
      }
    })();
    
    return () => {
      mounted = false;
      if (locationTimeout) {
        clearTimeout(locationTimeout);
      }
    };
  }, []);

  useEffect(() => {
    getDeviceId().then(setDeviceId).catch((error) => {
      console.warn('Error getting device ID:', error);
    });
  }, []);

  // Removed automatic animation to user location to keep focus on all pins on page load
  useEffect(() => {
    if (mapReady && userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        600
      );
    }
  }, [mapReady, userLocation]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMapError = useCallback((event: { nativeEvent?: { errorMessage?: string } }) => {
    const message = event?.nativeEvent?.errorMessage;
    console.warn('Map error:', message);
    setErrorMsg(() => {
      if (Platform.OS === 'android') {
        return 'Google basemap could not load. Showing OpenStreetMap tiles as a fallback.';
      }
      return message ?? 'Unable to load the map tiles.';
    });
    if (Platform.OS === 'android') {
      setUseFallbackTiles(true);
    }
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

  // Safety gate for showsUserLocation: only enable on iOS due to GMS version conflicts on Android
  // On Android, we'll show a manual marker instead to avoid IncompatibleClassChangeError
  const canShowUserLocation = Platform.select({
    ios: hasLocationPermission && mapReady,
    android: false, // Disabled on Android - using manual marker instead
    default: false,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't block the map if location permission is denied
  // Just show the map with default NYC location

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
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={!!canShowUserLocation}
          showsMyLocationButton={false}
          onMapReady={handleMapReady}
          onMapLoaded={handleMapReady}>
          {Platform.OS === 'android' && useFallbackTiles && (
            <UrlTile
              key="fallback-tiles"
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              tileSize={256}
              shouldReplaceMapContent
            />
          )}
          {/* Manual "You are here" marker on Android to avoid GMS conflicts */}
          {Platform.OS === 'android' && mapReady && userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              title="You are here"
              pinColor="#4285F4"
            />
          )}
          {mapReady && filteredLocations.map((location) => {
            const type = locationTypes[location.type as keyof typeof locationTypes];
            if (!type) return null;
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
                    {locationTypes[selectedLocation.type as keyof typeof locationTypes]?.name || 'Unknown'}
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
    flex: 1,
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
    paddingHorizontal: 20,
  },
  errorSubtext: {
    fontFamily: 'Inter_400Regular',
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    color: '#E2E8F0',
    fontSize: 16,
  },
  errorBanner: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 75, 75, 0.9)',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  errorBannerText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
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
