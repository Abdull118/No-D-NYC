import { Tabs } from 'expo-router';
import { Phone, Map, FileText } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF4B4B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.select({ web: 0, ios: 20, android: 20 }),
          left: Platform.select({ web: 0, ios: 20, android: 20 }),
          right: Platform.select({ web: 0, ios: 20, android: 20 }),
          height: 70,
          backgroundColor: Platform.select({ web: '#1A202C', ios: 'transparent', android: 'transparent' }),
          borderTopWidth: 0,
          elevation: 0,
          borderRadius: Platform.select({ web: 0, ios: 20, android: 20 }),
          overflow: Platform.select({ web: 'hidden', ios: 'visible', android: 'visible' }),
        },
        tabBarBackground: Platform.select({
          web: () => <></>,
          ios: () => (
            <BlurView
              tint="dark"
              intensity={80}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 20,
              }}
            />
          ),
          android: () => (
            <BlurView
              tint="dark"
              intensity={80}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 20,
              }}
            />
          ),
        }),
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
          marginBottom: 0,
          textAlign: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Help Now',
          tabBarIcon: ({ color, size }) => (
            <Phone size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Find Help',
          tabBarIcon: ({ color, size }) => (
            <Map size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}