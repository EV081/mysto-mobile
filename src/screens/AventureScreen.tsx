import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import Toast from '@components/common/Toast';
import { getMuseumPictures } from '@services/pictures/getMuseumPictures';
import { getMuseumHistory } from '@services/Gemma/getMuseumHistory';
import { useGoalInit } from '@hooks/useGoalInit';

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

function toMarqueeLines(texts: string[], max = 90): string[] {
  const out: string[] = [];
  for (const t0 of texts) {
    const t = (t0 ?? '').trim();
    if (!t) continue;
    if (t.length <= max) { out.push(t); continue; }
    let start = 0;
    while (start < t.length) {
      const end = Math.min(start + max, t.length);
      let cut = t.lastIndexOf(' ', end);
      if (cut <= start) cut = end;
      out.push(t.slice(start, cut).trim());
      start = cut + 1;
    }
  }
  return Array.from(new Set(out));
}

function extractReplyString(res: any): string | null {
  if (!res) return null;
  const data = res?.data ?? res;
  const r = data?.reply ?? res?.reply;
  return typeof r === 'string' ? r : null;
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
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Hook de inicio/gestión de goal
  const { goalId, status, message, isInitializing } = useGoalInit({
    museumId: params?.museumId,
    userLocation: params?.userLocation ?? null,
    autostart: true,
  });

  // === Auto + manual scroll con Animated.ScrollView ===
  // ✅ ref tipado a ScrollView (no al componente animado)
  const scrollRef = useRef<ScrollView | null>(null);
  const autoY = useRef(new Animated.Value(0)).current;
  const autoAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const valueListenerId = useRef<string | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 👇 NUEVO: pausas y timer de ciclo
  const PRE_DELAY_MS  = 1200; // espera ANTES de empezar
  const POST_DELAY_MS = 1200; // espera DESPUÉS de terminar
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper seguro para scrollTo
  const scrollToY = (y: number, animated = false) => {
    const node: any = scrollRef.current;
    if (!node) return;
    if (typeof node.scrollTo === 'function') {
      node.scrollTo({ y, animated });
    } else if (typeof node.getNode === 'function' && typeof node.getNode().scrollTo === 'function') {
      node.getNode().scrollTo({ y, animated });
    }
  };

  // Tamaños / tipografía
  const { height: screenH, width: screenW } = Dimensions.get('window');
  const DIALOG_HEIGHT = Math.min(Math.max(screenH * 0.36, 320), 600);
  const ITEM_SPACING = 10;
  const LINE_HEIGHT = 32;
  const FONT_SIZE = 20;
  const ITEM_HEIGHT = LINE_HEIGHT + ITEM_SPACING;
  const SPACER_HEIGHT = 48;

  const baseLines = useMemo(() => (dialogLines.length ? dialogLines : FALLBACK_LINES), [dialogLines]);
  const linesBlockHeight = useMemo(() => baseLines.length * ITEM_HEIGHT, [baseLines.length]);
  const loopTargetY = useMemo(() => linesBlockHeight + SPACER_HEIGHT, [linesBlockHeight]);
  const SPEED_PX_S = 18;

  // 👇 MODIFICADO: incluir delays antes y después
  const startAutoFrom = (fromY: number) => {
    stopAuto();
    scrollToY(fromY, false);
    autoY.setValue(fromY);

    cycleTimer.current = setTimeout(() => {
      valueListenerId.current = autoY.addListener(({ value }) => {
        scrollToY(value, false);
      });

      const remaining = Math.max(loopTargetY - fromY, 0);
      const duration = remaining > 0 ? (remaining / SPEED_PX_S) * 1000 : 0;

      const run = Animated.timing(autoY, {
        toValue: loopTargetY,
        duration: Math.max(duration, 400),
        easing: Easing.linear,
        useNativeDriver: false,
      });

      autoAnimRef.current = run;
      run.start(({ finished }) => {
        autoY.removeAllListeners();
        valueListenerId.current = null;
        if (!finished) return; // cancelado (usuario)

        cycleTimer.current = setTimeout(() => {
          scrollToY(0, false);
          startAutoFrom(0);
        }, POST_DELAY_MS);
      });
    }, PRE_DELAY_MS);
  };

  // 👇 MODIFICADO: limpia también el timer de ciclo
  const stopAuto = () => {
    autoAnimRef.current?.stop();
    autoAnimRef.current = null;
    if (valueListenerId.current) {
      autoY.removeListener(valueListenerId.current);
      valueListenerId.current = null;
    } else {
      autoY.removeAllListeners();
    }
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    if (cycleTimer.current) {
      clearTimeout(cycleTimer.current);
      cycleTimer.current = null;
    }
  };

  useEffect(() => {
    if (loadingHistory || isInitializing) return;
    if (!baseLines.length || loopTargetY <= 0) return;
    startAutoFrom(0);
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseLines, loopTargetY, loadingHistory, isInitializing]);

  const handleScrollBeginDrag = (_e: NativeSyntheticEvent<NativeScrollEvent>) => stopAuto();

  // 👇 MODIFICADO: reanudar tras drag con el mismo PRE_DELAY_MS
  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y || 0;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    if (cycleTimer.current) clearTimeout(cycleTimer.current);
    cycleTimer.current = setTimeout(() => startAutoFrom(Math.min(y, loopTargetY - 1)), PRE_DELAY_MS);
  };

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
      } catch {/* no crítico */}
    };
    fetchPictures();
  }, [params?.museumId]);

  // Toasts por estado del hook
  useEffect(() => {
    if (!status || status === 'idle' || status === 'starting') return;
    const show = (t: typeof toastType, m: string) => { setToastType(t); setToastMessage(m); setToastVisible(true); };
    if (status === 'blocked_distance') show('warning', 'Debes estar cerca del museo para iniciar la misión.');
    else if (status === 'insufficient_objects') show('error', 'El museo no tiene suficientes objetos culturales.');
    else if (status === 'not_found') show('error', 'Museo no encontrado.');
    else if (status === 'unauthorized') show('error', 'Sesión expirada o no autorizada.');
    else if (status === 'error' && message) show('error', message);
  }, [status, message]);

  // Historia IA → SOLO intro + pistas con id
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!params?.museumId) { setLoadingHistory(false); return; }
      if (isInitializing) { setLoadingHistory(true); return; }
      if (!goalId) {
        setDialogLines(FALLBACK_LINES);
        setObjectClues([]);
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      try {
        const res = await getMuseumHistory(goalId);
        const replyString = extractReplyString(res) ?? '';
        const { introTexts, clues } = extractIntroAndClues(replyString);

        const lines = toMarqueeLines(introTexts);
        if (alive) {
          setDialogLines(lines.length ? lines : FALLBACK_LINES);
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
  }, [goalId, isInitializing, params?.museumId]);

  // Navegar y ENVIAR pistas (solo ids)
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
  const showSpinner = loadingHistory || isInitializing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{headerTitle}</Text>
      </View>

      {museumImage ? (
        <Image source={{ uri: museumImage }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.heroFallback, { backgroundColor: colors.cardBackground }]}>
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
        <View style={styles.ribbon}>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.button.primary} />
          <Text style={[styles.ribbonText, { color: COLORS.button.primary }]}>HISTORIA</Text>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.button.primary} />
        </View>

        {showSpinner ? (
          <View style={{ alignItems: 'center', gap: 8, justifyContent: 'center', flex: 1 }}>
            <ActivityIndicator />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cargando historia…</Text>
          </View>
        ) : (
          <Animated.ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEnabled
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          >
            {baseLines.map((text, idx) => (
              <Text key={`a-${idx}`} style={[styles.dialogLine, { color: colors.text, lineHeight: 32, fontSize: 20 }]}>
                {text}
              </Text>
            ))}
            <View style={{ height: SPACER_HEIGHT }} />
            {baseLines.map((text, idx) => (
              <Text key={`b-${idx}`} style={[styles.dialogLine, { color: colors.text, lineHeight: 32, fontSize: 20 }]}>
                {text}
              </Text>
            ))}
          </Animated.ScrollView>
        )}
      </View>

      <TouchableOpacity style={[styles.goButton, { backgroundColor: COLORS.button.primary }]} onPress={onPressGo}>
        <Text style={styles.goButtonText}>GO</Text>
      </TouchableOpacity>

      <Toast visible={toastVisible} message={toastMessage} type={toastType} duration={2200} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },

  hero: { width: '100%', height: width * 0.56, borderRadius: 12 },
  heroFallback: { width: '100%', height: width * 0.56, borderRadius: 12, marginBottom: 16, borderColor: COLORS.black, borderWidth: 1 },
  fallbackText: { marginTop: 8, fontSize: 12 },

  dialogContainer: {
    marginTop: 24, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },

  ribbon: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1,
    borderColor: COLORS.button.primary, marginBottom: 8,
  },
  ribbonText: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },

  // 👇 MODIFICADO: texto justificado
  dialogLine: { fontSize: 20, marginBottom: 10, textAlign: 'justify', fontWeight: '600', letterSpacing: 0.2 },

  goButton: { position: 'absolute', bottom: 24, left: 16, right: 16, paddingVertical: 16, borderRadius: 999, alignItems: 'center', elevation: 2 },
  goButtonText: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 2 },
});
