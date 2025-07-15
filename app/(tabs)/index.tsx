import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, ImageBackground, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Ambulance, Heart, Pill } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const EMERGENCY_NUMBERS = [
  {
    id: 'ambulance',
    number: '911',
    title: 'Emergency',
    description: 'Call 911',
    icon: Ambulance,
    color: '#FF4B4B',
    gradient: ['#FF4B4B', '#D61C4E'] as [string, string],
  },
  // {
  //   id: 'ambulance',
  //   number: '911',
  //   title: 'Ambulance',
  //   description: 'Call Ambulance',
  //   icon: Ambulance,
  //   color: '#FF8F00',
  //   gradient: ['#FF8F00', '#DB6300'],
  // },
  {
    id: 'crisis',
    number: '988',
    title: 'Crisis Line',
    description: 'Suicide & Crisis',
    icon: Heart,
    color: '#22C55E',
    gradient: ['#22C55E', '#15803D'] as [string, string],
  },
  {
    id: 'hopeny',
    number: '18778467369',
    title: 'HOPE NY',
    description: 'Addiction Support',
    icon: Pill,
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
  },
  {
    id: 'Never',
    number: '18778467369',
    title: 'Never Use Alone',
    description: 'Addiction Support',
    icon: Pill,
    color: '#F59E42',
    gradient: ['#F59E42', '#F97316'] as [string, string],
  },
];

export default function HelpNowScreen() {
  const handleCall = (phoneNumber: string) => {
    const url = Platform.select({
      ios: `tel:${phoneNumber}`,
      android: `tel:${phoneNumber}`,
      web: `tel:${phoneNumber}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => console.error('Error opening phone:', err));
    }
  };

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Arrange buttons in 2x2 grid for tablet, 1 row for phone
  let gridContent;
  if (isTablet) {
    gridContent = (
      <View style={styles.gridTablet}>
        <View style={styles.gridRow}>
          {EMERGENCY_NUMBERS.slice(0, 2).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleCall(item.number)}
              accessibilityLabel={`Call ${item.title}`}
              accessibilityHint={`Initiates a phone call to ${item.description}`}
              style={styles.gridItemTablet}
            >
              <LinearGradient
                colors={item.gradient}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <item.icon color="white" size={32} strokeWidth={2.5} />
                <Text style={styles.buttonTitle}>{item.title}</Text>
                <Text style={styles.buttonDescription}>{item.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.gridRow}>
          {EMERGENCY_NUMBERS.slice(2, 4).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleCall(item.number)}
              accessibilityLabel={`Call ${item.title}`}
              accessibilityHint={`Initiates a phone call to ${item.description}`}
              style={styles.gridItemTablet}
            >
              <LinearGradient
                colors={item.gradient}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <item.icon color="white" size={32} strokeWidth={2.5} />
                <Text style={styles.buttonTitle}>{item.title}</Text>
                <Text style={styles.buttonDescription}>{item.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  } else {
    gridContent = (
      <View style={styles.grid}>
        {EMERGENCY_NUMBERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleCall(item.number)}
            accessibilityLabel={`Call ${item.title}`}
            accessibilityHint={`Initiates a phone call to ${item.description}`}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <item.icon color="white" size={32} strokeWidth={2.5} />
              <Text style={styles.buttonTitle}>{item.title}</Text>
              <Text style={styles.buttonDescription}>{item.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop' }}
      style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)'] as [string, string]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>No-D NYC</Text>
          <Text style={styles.headerSubtitle}>Get Help Now</Text>
        </View>
        {gridContent}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#E2E8F0',
    marginTop: 8,
    textAlign: 'center',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    width: Platform.select({ web: 200, default: 160 }),
    aspectRatio: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
    fontSize: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  buttonDescription: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  gridTablet: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  gridItemTablet: {
    marginHorizontal: 24,
  },
});