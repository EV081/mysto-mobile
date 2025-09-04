import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import Toast from '@components/common/Toast';
import { getMuseumPictures } from '@services/pictures/getMuseumPictures';
import { getMuseumHistory } from '@services/Gemma/getMuseumHistory';
import { useMuseumGoals } from '@hooks/aventure/useMuseumGoals'; // ✅ reemplaza al eliminado useGoalInit

interface AdventureRouteParams {
  museumId: number;
  museumName: string;
  museumLocation?: { latitude: number; longitude: number } | null;
  userLocation?: { latitude: number; longitude: number } | null;
  hasUserLocation?: boolean;
}

type HistoryItem = { id?: string; text: string };

const FALLBACK_LINES = [
  'Bienvenido explorador, tu misión comienza ahora...',
  'Este museo guarda secretos milenarios. ¿Te atreves a descubrirlos?',
  'Encuentra pistas, desbloquea historias y avanza hacia el objetivo.',
];

/** Extrae:
 *  - introTexts: solo elementos sin `id` hasta ANTES del primer `id`
 *  - clues: todos los elementos con `id`, normalizados a { id: string, text: string }
 */
function extractIntroAndClues(reply: string): { introTexts: string[]; clues: HistoryItem[] } {
  const introTexts: string[] = [];
  const clues: HistoryItem[] = [];

  if (!reply?.trim()) return { introTexts, clues };

  try {
    const arr = JSON.parse(reply);
    if (Array.isArray(arr)) {
      let reachedFirstId = false;

      for (const raw of arr) {
        const obj = (raw && typeof raw === 'object') ? (raw as Record<string, any>) : null;
        if (!obj) continue;

        const hasId = Object.prototype.hasOwnProperty.call(obj, 'id');

        if (hasId) {
          const idStr = String(obj.id);
          const txt = (typeof obj.text === 'string')
            ? obj.text
            : (() => {
                const v = Object.values(obj).find(v => typeof v === 'string');
                return typeof v === 'string' ? v : '';
              })();
          if (txt.trim()) clues.push({ id: idStr, text: txt.trim() });
          reachedFirstId = true;
          continue;
        }

        if (!reachedFirstId) {
          const txt = (typeof obj.text === 'string')
            ? obj.text
            : (() => {
                const v = Object.values(obj).find(v => typeof v === 'string');
                return typeof v === 'string' ? v : '';
              })();
          if (txt.trim()) introTexts.push(txt.trim());
        }
      }
      return { introTexts, clues };
    }
  } catch {
    // fallback abajo
  }

  const lines = reply
    .replace(/\r/g, '\n')
    .split(/\n+/g)
    .map(s => s.trim())
    .filter(Boolean);

  return { introTexts: lines, clues: [] };
}

export default function AventureScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as AdventureRouteParams;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [museumImage, setMuseumImage] = useState<string | null>(null);

  // Intro + pistas
  const [objectClues, setObjectClues] = useState<HistoryItem[]>([]);
  const [dialogLines, setDialogLines] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] =
    useState<'success' | 'error' | 'warning' | 'info'>('info');

  // ✅ Usar useMuseumGoals (auto inicia si no hay meta y entrega goalId real)
  const {
    goalId,                  // <-- goalId REAL del backend
    isLoading: goalsLoading, // para spinner
    error: goalsError,
    refreshGoals,            // por si quieres forzar recarga
  } = useMuseumGoals({
    museumId: params.museumId,
    userLocation: params.userLocation,
    autoStart: true,
  });

  // Tamaño responsive del panel de texto
  const { height: screenH, width: screenW } = Dimensions.get('window');
  const DIALOG_HEIGHT = Math.min(Math.max(screenH * 0.36, 320), 600);

  // Imagen header
  useEffect(() => {
    const fetchPictures = async () => {
      try {
        if (!params?.museumId) return;
        const pics = await getMuseumPictures(params.museumId);
        if (Array.isArray(pics) && pics.length > 0) {
          setMuseumImage(
            (pics[0] as any).url ??
            (pics[0] as any).pictureUrl ??
            (pics[0] as any).path ??
            null
          );
        }
      } catch {
        // no crítico
      }
    };
    fetchPictures();
  }, [params?.museumId]);

  // Toast si falla el hook de metas
  useEffect(() => {
    if (!goalsError) return;
    setToastType('error');
    setToastMessage(goalsError);
    setToastVisible(true);
  }, [goalsError]);

  // Historia IA → SOLO cuando ya tenemos goalId válido
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!params?.museumId) { setLoadingHistory(false); return; }

      // Esperar a que exista goalId (no usamos museumId jamás para Gemma)
      if (!goalId || goalId === params.museumId) {
        setDialogLines(FALLBACK_LINES);
        setObjectClues([]);
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      try {
        // getMuseumHistory ahora devuelve { reply: string }
        const { reply } = await getMuseumHistory(goalId);
        const { introTexts, clues } = extractIntroAndClues(reply || '');

        if (alive) {
          setDialogLines(introTexts.length ? introTexts : FALLBACK_LINES);
          setObjectClues(clues.filter(c => c.id && typeof c.text === 'string' && c.text.trim()));
        }
      } catch {
        if (alive) {
          setDialogLines(FALLBACK_LINES);
          setObjectClues([]);
          setToastType('error');
          setToastMessage('No se pudo cargar la historia. Usando texto predeterminado.');
          setToastVisible(true);
        }
      } finally {
        if (alive) setLoadingHistory(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [goalId, params?.museumId]);

  // Navegar y ENVIAR pistas (solo ids) a GoalsScreen
  const onPressGo = () => {
    const cluesPayload = objectClues.map(c => ({ id: String(c.id), text: c.text }));
    navigation.navigate('Goals', {
      museumId: params.museumId,
      museumName: params.museumName,
      museumLocation: params.museumLocation,
      userLocation: params.userLocation,
      objectClues: cluesPayload,
    });
  };

  const headerTitle = useMemo(() => params?.museumName ?? 'Aventura Cultural', [params?.museumName]);
  const showSpinner = loadingHistory || goalsLoading;

  // Un solo párrafo justificado
  const introParagraph = useMemo(
    () => (dialogLines.length ? dialogLines : FALLBACK_LINES).join(' '),
    [dialogLines]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{headerTitle}</Text>
      </View>

      {museumImage ? (
        <Image source={{ uri: museumImage }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.heroFallback, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Ionicons name="image-outline" size={48} color={colors.text} />
          <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>Imagen del museo</Text>
        </View>
      )}

      <View
        style={[
          styles.dialogContainer,
          { backgroundColor: colors.cardBackground, borderColor: colors.border, height: DIALOG_HEIGHT, minHeight: 320 },
        ]}
      >
        <View style={[styles.ribbon, { borderColor: COLORS.primary }]}>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.ribbonText, { color: COLORS.primary }]}>HISTORIA</Text>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
        </View>

        {showSpinner ? (
          <View style={{ alignItems: 'center', gap: 8, justifyContent: 'center', flex: 1 }}>
            <ActivityIndicator />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cargando historia…</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            <Text
              style={[styles.dialogParagraph, { color: colors.text }]}
              // iOS
              // @ts-ignore
              hyphenationFactor={1.0}
              // ANDROID
              // @ts-ignore
              textBreakStrategy="balanced"
            >
              {introParagraph}
            </Text>
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        style={[styles.goButton, { backgroundColor: colors.buttonBackground }]}
        onPress={onPressGo}
      >
        <Text style={[styles.goButtonText, { color: colors.buttonText }]}>GO</Text>
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
  container: { flex: 1, paddingHorizontal: 16 },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },

  hero: { width: '100%', height: width * 0.56, borderRadius: 12 },
  heroFallback: {
    width: '100%', height: width * 0.56, borderRadius: 12, marginBottom: 16,
    borderWidth: 1,
  },
  fallbackText: { marginTop: 8, fontSize: 12 },

  dialogContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: COLORS.card.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  ribbon: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
  },
  ribbonText: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },

  dialogParagraph: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'justify',
    letterSpacing: 0.2,
    includeFontPadding: false,
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
  goButtonText: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
});
