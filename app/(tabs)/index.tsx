import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, ImageBackground, useWindowDimensions, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Ambulance, Heart, Pill, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS, type Language } from '@/data/translations';

const LANGUAGE_KEY = 'app-language';

const EMERGENCY_NUMBERS_CONFIG = [
  {
    id: 'ambulance',
    number: '911',
    icon: Ambulance,
    color: '#FF4B4B',
    gradient: ['#FF4B4B', '#D61C4E'] as [string, string],
  },
  {
    id: 'crisis',
    number: '988',
    icon: Heart,
    color: '#22C55E',
    gradient: ['#22C55E', '#15803D'] as [string, string],
  },
  {
    id: 'hopeny',
    number: '18778467369',
    icon: Pill,
    color: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
  },
  {
    id: 'Never',
    number: '18778467369',
    icon: Pill,
    color: '#F59E42',
    gradient: ['#F59E42', '#F97316'] as [string, string],
  },
];

export default function HelpNowScreen() {
  const [showIpadGuard, setShowIpadGuard] = useState(false);
  const [language, setLanguage] = useState<Language>('En');
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  // Load language from storage
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored === 'En' || stored === 'Es') {
        setLanguage(stored);
      }
    });
  }, []);

  // Save language to storage
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
  };
  
  // Calculate button size for smaller devices
  // For phones: use 2x2 grid, calculate size based on available width
  // Account for padding (20px each side = 40px total), margins (8px each side per button = 32px total), and extra buffer
  const phonePadding = 40; // 20px padding on each side
  const buttonMargins = 32; // 8px margin on each side of each button (4 margins total)
  const safetyBuffer = 8; // Extra buffer to prevent cropping
  const availableWidth = width - phonePadding - buttonMargins - safetyBuffer;
  const buttonSize = isTablet ? undefined : Math.floor(availableWidth / 2);
  
  // Calculate icon and font sizes based on button size
  const iconSize = isTablet ? 32 : buttonSize ? Math.max(24, Math.floor(buttonSize * 0.2)) : 32;
  const titleFontSize = isTablet ? 20 : buttonSize ? Math.max(16, Math.floor(buttonSize * 0.125)) : 20;
  const descriptionFontSize = isTablet ? 14 : buttonSize ? Math.max(12, Math.floor(buttonSize * 0.0875)) : 14;
  const buttonPadding = isTablet ? 20 : buttonSize ? Math.max(12, Math.floor(buttonSize * 0.125)) : 20;

  // Detect if device is an iPad
  const isIpad = Platform.OS === 'ios' && (Platform.isPad || isTablet);

  const handleCall = (phoneNumber: string) => {
    // Show guard modal if user is on iPad
    if (isIpad) {
      setShowIpadGuard(true);
      return;
    }

    // Otherwise, make the phone call
    const url = Platform.select({
      ios: `tel:${phoneNumber}`,
      android: `tel:${phoneNumber}`,
      web: `tel:${phoneNumber}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => console.error('Error opening phone:', err));
    }
  };

  // Get translations for current language
  const t = TRANSLATIONS[language];
  
  // Map emergency numbers with translations
  const getEmergencyNumber = (config: typeof EMERGENCY_NUMBERS_CONFIG[0]) => {
    const translations = {
      ambulance: t.emergency,
      crisis: t.crisis,
      hopeny: t.hopeny,
      Never: t.never,
    };
    return {
      ...config,
      title: translations[config.id as keyof typeof translations].title,
      description: translations[config.id as keyof typeof translations].description,
    };
  };

  const EMERGENCY_NUMBERS = EMERGENCY_NUMBERS_CONFIG.map(getEmergencyNumber);

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
              accessibilityLabel={`${t.accessibility.call} ${item.title}`}
              accessibilityHint={`${t.accessibility.initiatesCall} ${item.description}`}
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
              accessibilityLabel={`${t.accessibility.call} ${item.title}`}
              accessibilityHint={`${t.accessibility.initiatesCall} ${item.description}`}
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
    // Use 2x2 grid for phones to ensure all buttons fit
    gridContent = (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            {EMERGENCY_NUMBERS.slice(0, 2).map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleCall(item.number)}
                accessibilityLabel={`${t.accessibility.call} ${item.title}`}
                accessibilityHint={`${t.accessibility.initiatesCall} ${item.description}`}
                style={styles.gridItem}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={[styles.button, buttonSize ? { width: buttonSize, height: buttonSize, padding: buttonPadding } : {}]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}>
                  <item.icon color="white" size={iconSize} strokeWidth={2.5} />
                  <Text style={[styles.buttonTitle, { fontSize: titleFontSize }]}>{item.title}</Text>
                  <Text style={[styles.buttonDescription, { fontSize: descriptionFontSize }]}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.gridRow}>
            {EMERGENCY_NUMBERS.slice(2, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleCall(item.number)}
                accessibilityLabel={`${t.accessibility.call} ${item.title}`}
                accessibilityHint={`${t.accessibility.initiatesCall} ${item.description}`}
                style={styles.gridItem}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={[styles.button, buttonSize ? { width: buttonSize, height: buttonSize, padding: buttonPadding } : {}]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}>
                  <item.icon color="white" size={iconSize} strokeWidth={2.5} />
                  <Text style={[styles.buttonTitle, { fontSize: titleFontSize }]}>{item.title}</Text>
                  <Text style={[styles.buttonDescription, { fontSize: descriptionFontSize }]}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
          <Text style={styles.headerSubtitle}>{t.headerSubtitle}</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => handleLanguageChange(language === 'En' ? 'Es' : 'En')}
            accessibilityLabel={`${t.accessibility.switchLanguage} ${language === 'En' ? 'Spanish' : 'English'}`}
          >
            <Text style={styles.languageButtonText}>{language}</Text>
          </TouchableOpacity>
        </View>
        {gridContent}
      </SafeAreaView>

      {/* iPad Guard Modal */}
      <Modal
        visible={showIpadGuard}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIpadGuard(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIpadGuard(false)}
              accessibilityLabel={t.modal.close}
            >
              <X color="#94A3B8" size={24} />
            </TouchableOpacity>
            
            <View style={styles.modalHeader}>
              <Phone color="#FF4B4B" size={48} strokeWidth={2} />
              <Text style={styles.modalTitle}>{t.modal.title}</Text>
            </View>

            <Text style={styles.modalMessage}>
              {t.modal.message}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowIpadGuard(false)}
            >
              <LinearGradient
                colors={['#FF4B4B', '#D61C4E'] as [string, string]}
                style={styles.modalButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.modalButtonText}>{t.modal.button}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
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
  languageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridItem: {
    marginHorizontal: 8,
  },
  button: {
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
    minWidth: 120,
    minHeight: 120,
  },
  buttonTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  },
  buttonDescription: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A202C',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  modalTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: 'white',
  },
});