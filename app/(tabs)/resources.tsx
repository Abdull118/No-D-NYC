import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, CircleAlert as AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const RESOURCES = [
  {
    id: 'snap',
    title: 'SNAP Benefits',
    description: 'Apply for food assistance in NYC',
    url: 'https://www.ny.gov/services/apply-snap',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
  },
  {
    id: 'id',
    title: 'Replace Lost ID',
    description: 'Information on getting a new ID in NYC',
    comingSoon: false,
    url: 'https://dmv.ny.gov/non-driver-id/replace-a-non-driver-id?utm_source=chatgpt.com',
    gradient: ['#6B7280', '#4B5563'] as [string, string],
  },
  {
    id: 'shelter',
    title: 'Find a Shelter',
    description: 'Directory of NYC homeless shelters',
    url: 'https://www1.nyc.gov/site/dhs/shelter/shelter.page',
    gradient: ['#22C55E', '#15803D'] as [string, string],
  },
  {
    id: 'medical',
    title: 'Medical Care',
    description: 'Free and low-cost healthcare options',
    url: 'https://www.nychealthandhospitals.org/',
    gradient: ['#FF4B4B', '#D61C4E'] as [string, string],
  },
  {
    id: 'drug-checking',
    title: 'Drug Checking & Testing',
    description: 'Find sites in NYC where you can bring your drugs to get tested for safety. Main site: OnPoint NYC. More info and locations available.',
    url: 'https://onpointnyc.org/drug-checking/',
    extraLinks: [
      { label: 'OnPoint NYC Contact', url: 'https://onpointnyc.org/contact-us/' },
      { label: 'NY State Health Drug Checking', url: 'https://www.health.ny.gov/diseases/aids/consumers/prevention/oduh/drug_checking.htm' },
      { label: 'SACHR', url: 'https://www.sachr.org/' },
    ],
    gradient: ['#8B5CF6', '#6366F1'] as [string, string],
  },
  {
    id: 'narcan',
    title: 'Get Free Narcan',
    description: 'Find locations in NYC where you can get free Narcan (naloxone) to reverse opioid overdoses. Includes city and state resources.',
    url: 'https://www.nyc.gov/site/doh/health/health-topics/naloxone.page',
    extraLinks: [
      { label: 'NYC Naloxone (Narcan) Info', url: 'https://www.nyc.gov/site/doh/health/health-topics/naloxone.page' },
      { label: 'NY State Naloxone (Narcan) Info', url: 'https://www.health.ny.gov/diseases/aids/general/opioid_overdose_prevention/directories.htm' },
    ],
    gradient: ['#F59E42', '#F97316'] as [string, string],
  },
];

export default function ResourcesScreen() {
  const handlePress = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=2070&auto=format&fit=crop' }}
      style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Resources</Text>
          <Text style={styles.headerSubtitle}>Access helpful services and information</Text>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {RESOURCES.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              onPress={() => handlePress(resource.url)}
              disabled={resource.comingSoon}
              accessibilityLabel={resource.title}
              accessibilityHint={`Opens information about ${resource.title}`}
              style={styles.cardContainer}>
              <LinearGradient
                colors={resource.gradient}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{resource.title}</Text>
                  <Text style={styles.cardDescription}>{resource.description}</Text>
                  {/* Render extra links if present */}
                  {resource.extraLinks && (
                    <View style={{ marginBottom: 12 }}>
                      {resource.extraLinks.map((link, idx) => (
                        <TouchableOpacity key={idx} onPress={() => handlePress(link.url)}>
                          <Text style={{ color: '#A5B4FC', textDecorationLine: 'underline', marginBottom: 4 }}>
                            {link.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {resource.comingSoon ? (
                    <View style={styles.comingSoonContainer}>
                      <AlertCircle color="#FF4B4B" size={16} />
                      <Text style={styles.comingSoon}>Coming Soon</Text>
                    </View>
                  ) : (
                    <View style={styles.linkContainer}>
                      <ExternalLink color="white" size={16} />
                      <Text style={styles.linkText}>Learn More</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
          {/* Add extra space at the end for better scrollability */}
          <View style={{ height: 48 }} />
        </ScrollView>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 42,
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#E2E8F0',
  },
  scrollView: {
    flex: 1,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 24,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: 'white',
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  comingSoonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comingSoon: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FF4B4B',
    fontSize: 14,
    marginLeft: 6,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
  },
});