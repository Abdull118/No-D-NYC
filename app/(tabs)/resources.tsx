import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, CircleAlert as AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS, type Language } from '@/data/translations';

const LANGUAGE_KEY = 'app-language';

const RESOURCES_CONFIG = [
  {
    id: 'snap',
    url: 'https://www.ny.gov/services/apply-snap',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
  },
  {
    id: 'id',
    comingSoon: false,
    url: 'https://dmv.ny.gov/non-driver-id/replace-a-non-driver-id?utm_source=chatgpt.com',
    gradient: ['#6B7280', '#4B5563'] as [string, string],
  },
  {
    id: 'shelter',
    url: 'https://www1.nyc.gov/site/dhs/shelter/shelter.page',
    gradient: ['#22C55E', '#15803D'] as [string, string],
  },
  {
    id: 'medical',
    url: 'https://www.nychealthandhospitals.org/',
    gradient: ['#FF4B4B', '#D61C4E'] as [string, string],
  },
  {
    id: 'drug-checking',
    url: 'https://onpointnyc.org/drug-checking/',
    extraLinkKeys: ['onpointContact', 'nyStateHealth', 'sachr'],
    extraLinkUrls: [
      'https://onpointnyc.org/contact-us/',
      'https://www.health.ny.gov/diseases/aids/consumers/prevention/oduh/drug_checking.htm',
      'https://www.sachr.org/',
    ],
    gradient: ['#8B5CF6', '#6366F1'] as [string, string],
  },
  {
    id: 'narcan',
    url: 'https://www.nyc.gov/site/doh/health/health-topics/naloxone.page',
    extraLinkKeys: ['nycNaloxone', 'nyStateNaloxone'],
    extraLinkUrls: [
      'https://www.nyc.gov/site/doh/health/health-topics/naloxone.page',
      'https://www.health.ny.gov/diseases/aids/general/opioid_overdose_prevention/directories.htm',
    ],
    gradient: ['#F59E42', '#F97316'] as [string, string],
  },
];

export default function ResourcesScreen() {
  const [language, setLanguage] = useState<Language>('En');

  // Load language from storage
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored === 'En' || stored === 'Es') {
        setLanguage(stored);
      }
    });
  }, []);

  // Subscribe to language changes
  useEffect(() => {
    const interval = setInterval(() => {
      AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
        if (stored === 'En' || stored === 'Es') {
          setLanguage(stored);
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const t = TRANSLATIONS[language];

  // Map resources with translations
  const getResource = (config: typeof RESOURCES_CONFIG[0]) => {
    // Map resource IDs to translation keys
    const idMap: Record<string, keyof typeof t.resources.items> = {
      'snap': 'snap',
      'id': 'id',
      'shelter': 'shelter',
      'medical': 'medical',
      'drug-checking': 'drugChecking',
      'narcan': 'narcan',
    };
    const translationKey = idMap[config.id] || config.id as keyof typeof t.resources.items;
    const resourceData = t.resources.items[translationKey];
    if (!resourceData) return null;

    const resource: any = {
      ...config,
      title: resourceData.title,
      description: resourceData.description,
    };

    // Add extra links if they exist
    if (config.extraLinkKeys && config.extraLinkUrls && 'extraLinks' in resourceData) {
      const extraLinksData = (resourceData as any).extraLinks;
      resource.extraLinks = config.extraLinkKeys.map((key, index) => ({
        label: extraLinksData[key as keyof typeof extraLinksData],
        url: config.extraLinkUrls![index],
      }));
    }

    return resource;
  };

  const RESOURCES = RESOURCES_CONFIG.map(getResource).filter(Boolean);

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
          <Text style={styles.headerTitle}>{t.resources.headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{t.resources.headerSubtitle}</Text>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {RESOURCES.map((resource) => (
            <TouchableOpacity
              key={resource.id}
              onPress={() => handlePress(resource.url)}
              disabled={resource.comingSoon}
              accessibilityLabel={resource.title}
              accessibilityHint={`${t.resources.accessibility.opensInfo} ${resource.title}`}
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
                      <Text style={styles.comingSoon}>{t.resources.comingSoon}</Text>
                    </View>
                  ) : (
                    <View style={styles.linkContainer}>
                      <ExternalLink color="white" size={16} />
                      <Text style={styles.linkText}>{t.resources.learnMore}</Text>
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