import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Image, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import Toast from '@components/common/Toast';
import { getMuseumPictures } from '@services/pictures/getMuseumPictures';

interface AdventureRouteParams {
  museumId: number;
  museumName: string;
  museumLocation?: { latitude: number; longitude: number; } | null;
  userLocation?: { latitude: number; longitude: number; } | null;
  hasUserLocation?: boolean;
}

const DIALOG_LINES = [
  'Bienvenido explorador, tu misión comienza ahora...',
  'Este museo guarda secretos milenarios. ¿Te atreves a descubrirlos?',
  'Encuentra pistas, desbloquea historias y avanza hacia el objetivo.'
];

export default function AventureScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as AdventureRouteParams;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [museumImage, setMuseumImage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Créditos: scroll vertical suave y continuo
  const lines = useMemo(() => [...DIALOG_LINES, ...DIALOG_LINES], []);
  const scrollY = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const ITEM_SPACING = 6;
  const LINE_HEIGHT = 22;
  const ITEM_HEIGHT = LINE_HEIGHT + ITEM_SPACING; // Altura por línea
  const HALF_CONTENT_HEIGHT = (lines.length / 2) * ITEM_HEIGHT; // altura de un set de líneas

  useEffect(() => {
    // Animación tipo créditos: sube hasta la mitad (un set), resetea y repite
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollY, {
          toValue: -HALF_CONTENT_HEIGHT,
          duration: Math.max(8000, HALF_CONTENT_HEIGHT * 30), // velocidad estable
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
    };
  }, [HALF_CONTENT_HEIGHT, scrollY]);

  useEffect(() => {
    const fetchPictures = async () => {
      try {
        if (!params?.museumId) return;
        const pics = await getMuseumPictures(params.museumId);
        if (Array.isArray(pics) && pics.length > 0) {
          setMuseumImage((pics[0] as any).url ?? (pics[0] as any).pictureUrl ?? (pics[0] as any).path ?? null);
        }
      } catch (e) {
        // No crítico para la UX
      }
    };
    fetchPictures();
  }, [params?.museumId]);

  const onPressGo = () => {
    const hasUser = !!params?.hasUserLocation && !!params?.userLocation;
    const hasMuseum = !!params?.museumLocation;
    if (hasUser && hasMuseum) {
      navigation.navigate('Goals', {
        museumId: params.museumId,
        museumName: params.museumName,
        museumLocation: params.museumLocation,
        userLocation: params.userLocation,
      });
      return;
    }
    setToastType('warning');
    setToastMessage('Activa tu ubicación para comenzar la misión.');
    setToastVisible(true);
  };

  const headerTitle = useMemo(() => params?.museumName ?? 'Aventura Cultural', [params?.museumName]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}> 
        <Text style={[styles.title, { color: colors.text }]}>
          {headerTitle}
        </Text>
      </View>

      {museumImage ? (
        <Image source={{ uri: museumImage }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.heroFallback, { backgroundColor: colors.cardBackground }]}> 
          <Ionicons name="image-outline" size={48} color={colors.text} />
          <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>Imagen del museo</Text>
        </View>
      )}

      <View style={[styles.dialogContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
        <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
          {lines.map((text, idx) => (
            <Text key={`${idx}-${text}`} style={[styles.dialogLine, { color: colors.text, lineHeight: LINE_HEIGHT }]}> 
              {text}
            </Text>
          ))}
        </Animated.View>
      </View>

      <TouchableOpacity style={[styles.goButton, { backgroundColor: COLORS.button.primary }]} onPress={onPressGo}>
        <Text style={styles.goButtonText}>GO</Text>
      </TouchableOpacity>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={2200}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hero: {
    width: '100%',
    height: width * 0.56,
    borderRadius: 12,
  },
  heroFallback: {
    width: '100%',
    height: width * 0.56,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: COLORS.black, 
    borderWidth: 1,   
  },
  cardContent: {
    padding: 20,
  },
  startIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  startDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'justify',
  },
  objectSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  objectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  albumItemContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  searchSection: {
    alignItems: 'center',
  },
  searchText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 200,
  },
  verifiedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 12,
  },
  dialogContainer: {
    marginTop: 60,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 240, // Tarjeta más grande para el texto
    height: 240,
    overflow: 'hidden',
  },
  dialogLine: {
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  goButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    elevation: 2,
  },
  goButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
