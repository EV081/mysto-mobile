import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getThemeColors, COLORS } from '@constants/colors';
import { useToast } from '@hooks/useToast';
import { useLocationValidation } from '@hooks/aventure/useLocationValidation';
import { getObjectbyImage } from '@services/imageRecognition/getObjectbyImage';
import { validateGoal } from '@services/goals/validateGoal';
import { getGoals } from '@services/goals/getGoal';
import Toast from '@components/common/Toast';
import GameToast from '@components/common/GameToast';
import { useGoalsState } from '@contexts/GoalContext';

interface GoalDetailRouteParams {
  object: {
    id: number;
    name: string;
    description: string;
    pictureUrls: string[];
    type: string;
    isDiscovered: boolean;
    clueTexts?: string[];
  };
  museumId: number;
  museumName: string;
  museumHistory?: any;
  goalId?: number; // <-- debe venir de GoalsScreen
}

export default function GoalDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as GoalDetailRouteParams;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const { showError, hideToast, toast } = useToast();

  const [isValidating, setIsValidating] = useState(false);
  const [wasDiscovered, setWasDiscovered] = useState(params.object.isDiscovered);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [objectDetails, setObjectDetails] = useState<any>(null);
  const [goalId, setGoalId] = useState<number | null>(params.goalId ?? null);
  const [museumHistory] = useState<any>(params.museumHistory || null);

  const { goalId: ctxGoalId, found, refresh, markFound } = useGoalsState(params.museumId);

  const { validateLocation, isValidatingLocation, isLocationValid } = useLocationValidation({
    museumId: params.museumId,
    userLocation,
  });

  // Asegurar goalId válido (NO usar museumId como fallback)
  useEffect(() => {
    const ensureGoalId = async () => {
      // prioridad: param.goalId -> ctxGoalId -> getGoals()
      if (goalId && typeof goalId === 'number') return;
      if (ctxGoalId && typeof ctxGoalId === 'number') {
        setGoalId(ctxGoalId);
        return;
      }
      try {
        const resp = await getGoals(params.museumId);
        if (resp && typeof resp.id === 'number') {
          setGoalId(resp.id);
          refresh();
        } else {
          showError('No se pudo obtener el ID de la meta.');
        }
      } catch (e) {
        showError('No se pudo obtener la meta activa.');
      }
    };
    ensureGoalId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.museumId, ctxGoalId]);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos de Cámara', 'Se necesitan permisos de cámara para validar el objeto.', [{ text: 'Entendido' }]);
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: undefined,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
    return null;
  };

  const [gameToastVisible, setGameToastVisible] = useState(false);
  const [gameToastMsg, setGameToastMsg] = useState('');

  const validateObjectImage = async (imageUri: string) => {
    if (!goalId) {
      showError('Error: No se pudo obtener el ID de la meta');
      return false;
    }
    try {
      const validationResult = await getObjectbyImage(params.object.id, imageUri, 0.5);
      if (validationResult && validationResult.object) {
        setObjectDetails(validationResult.object);
        setWasDiscovered(true);

        try {
          await validateGoal(goalId, validationResult.object.id);
          markFound(validationResult.object.id);
          setWasDiscovered(true);
          setGameToastMsg(`${validationResult.object.name}`);
          setGameToastVisible(true);
        } catch (goalError: any) {
          if (goalError?.response?.status === 404) {
            showError('Objeto validado pero no se pudo actualizar la meta. Contacta al administrador.');
          } else {
            showError('Objeto validado pero error al actualizar la meta. Intenta de nuevo.');
          }
        }
        return true;
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        const errorMessage = error?.response?.data?.detail || 'La imagen no coincide con este objeto. Intenta con otra imagen.';
        showError(errorMessage);
      } else {
        const errorMessage = error?.response?.data?.detail || 'No se pudo validar el objeto. Intenta de nuevo.';
        showError(errorMessage);
      }
    }
    return false;
  };

  const handleCameraPress = async () => {
    if (wasDiscovered) {
      Alert.alert('Objeto ya descubierto', 'Este objeto ya ha sido descubierto.', [{ text: 'Entendido' }]);
      return;
    }
    if (!goalId) {
      showError('Error: No se pudo obtener el ID de la meta');
      return;
    }
    try {
      setIsValidating(true);
      const imageUri = await openCamera();
      if (!imageUri) {
        setIsValidating(false);
        return;
      }
      await validateObjectImage(imageUri);
    } finally {
      setIsValidating(false);
    }
  };

  const cluesText = useMemo(() => {
    const clues = params.object.clueTexts?.filter(t => !!t?.trim()) ?? [];
    if (!clues.length) return '';
    return clues.map(t => `• ${t.trim()}`).join('\n\n');
  }, [params.object.clueTexts]);

  const effectiveText =
    (cluesText && cluesText.trim().length)
      ? cluesText
      : (objectDetails?.description || params.object.description?.trim() || 'No hay pistas disponibles por ahora.');

  const isObjectDiscovered = wasDiscovered || params.object.isDiscovered;
  const finalObjectDetails = objectDetails || params.object;

  const cardConfig = useMemo(() => {
    const typeStr = String(finalObjectDetails.type || '').toUpperCase();
    if (typeStr.includes('CERAM') || typeStr.includes('1')) {
      return { frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [string, string, ...string[]], borderColor: '#654321', typeText: 'CERÁMICA', holo: ['#8B4513', '#CD853F'] as [string, string] };
    }
    if (typeStr.includes('TEXTIL') || typeStr.includes('3')) {
      return { frameColors: ['#800080', '#DA70D6', '#DDA0DD'] as [string, string, ...string[]], borderColor: '#4B0082', typeText: 'TEXTIL', holo: ['#800080', '#DDA0DD'] as [string, string] };
    }
    if (typeStr.includes('PAINT') || typeStr.includes('PINTUR') || typeStr.includes('2')) {
      return { frameColors: ['#4169E1', '#6495ED', '#87CEEB'] as [string, string, ...string[]], borderColor: '#191970', typeText: 'PINTURA', holo: ['#4169E1', '#87CEEB'] as [string, string] };
    }
    if (typeStr.includes('GOLD') || typeStr.includes('ORFEB') || typeStr.includes('4')) {
      return { frameColors: ['#DAA520', '#FFD700', '#FFF8DC'] as [string, string, ...string[]], borderColor: '#B8860B', typeText: 'ORFEBRERÍA', holo: ['#DAA520', '#FFF8DC'] as [string, string] };
    }
    return { frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [string, string, ...string[]], borderColor: '#654321', typeText: 'OBJETO', holo: ['#8B4513', '#CD853F'] as [string, string] };
  }, [finalObjectDetails.type]);

  const valueStars = isObjectDiscovered ? '★★★★' : '????';
  const rarityStars = isObjectDiscovered ? '★★★' : '???';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GameToast
        visible={gameToastVisible}
        message="¡Objeto desbloqueado!"
        subMessage={gameToastMsg}
        onHide={() => setGameToastVisible(false)}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {finalObjectDetails.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Card */}
      <View style={styles.content}>
        <View style={[styles.cardContainer, !isObjectDiscovered && styles.lockedCard]}>
          <LinearGradient colors={cardConfig.frameColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFrame}>
            <View style={[styles.innerBorder, { borderColor: cardConfig.borderColor }]}>
              <View style={styles.headerSection}>
                <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.nameBar}>
                  <Text style={[styles.cardName, !isObjectDiscovered && { color: '#666' }]} numberOfLines={1}>
                    {isObjectDiscovered ? finalObjectDetails.name.toUpperCase() : '???'}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.artworkFrame}>
                <View style={styles.artworkContainer}>
                  {isObjectDiscovered && (objectDetails?.url_image || finalObjectDetails.pictureUrls?.[0]) ? (
                    <Image
                      source={{ uri: objectDetails?.url_image || finalObjectDetails.pictureUrls[0] }}
                      style={[styles.artwork, !isObjectDiscovered && styles.lockedImage]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderArtwork}>
                      <Ionicons name="image-outline" size={40} color={isDark ? COLORS.gray[300] : COLORS.gray[600]} />
                    </View>
                  )}
                  {!isObjectDiscovered && (
                    <View style={styles.lockOverlay}>
                      <View style={styles.lockIcon}>
                        <Ionicons name="lock-closed" size={24} color="#fff" />
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.typeSection, { backgroundColor: cardConfig.borderColor }]}>
                <Text style={styles.typeLabel}>[{cardConfig.typeText}]</Text>
                <LinearGradient colors={cardConfig.holo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hologramStripe} />
              </View>

              <View style={styles.descriptionSection}>
                {isObjectDiscovered ? (
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {effectiveText}
                  </Text>
                ) : (
                  <Text style={styles.hiddenText} numberOfLines={3}>
                    Reliquia cultural oculta...
                  </Text>
                )}
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>VAL</Text>
                  <Text style={styles.statValue}>{valueStars}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>RAR</Text>
                  <Text style={styles.statValue}>{rarityStars}</Text>
                </View>
              </View>

              {/* Esquinas */}
              <View style={[styles.cornerDecor, styles.topLeft]} />
              <View style={[styles.cornerDecor, styles.topRight]} />
              <View style={[styles.cornerDecor, styles.bottomLeft]} />
              <View style={[styles.cornerDecor, styles.bottomRight]} />
            </View>
          </LinearGradient>
        </View>

        {/* FAB cámara */}
        <TouchableOpacity
          onPress={handleCameraPress}
          disabled={isValidating}
          style={[styles.fabCamera, { backgroundColor: colors.buttonBackground, opacity: isValidating ? 0.6 : 1 }]}
          activeOpacity={0.9}
        >
          {isValidating ? <Ionicons name="hourglass" size={22} color={colors.buttonText} /> : <Ionicons name="camera" size={22} color={colors.buttonText} />}
        </TouchableOpacity>
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

/* ====== styles ====== */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', maxWidth: '70%', textAlign: 'center' },
  content: { flex: 1, padding: 8 },
  cardContainer: { flex: 1, margin: 8, elevation: 8, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10, borderRadius: 12 },
  lockedCard: { opacity: 0.7 },
  cardFrame: { borderRadius: 12, padding: 4, flex: 1 },
  innerBorder: { flex: 1, borderWidth: 2.5, borderRadius: 10, padding: 8, position: 'relative', backgroundColor: '#F5F5DC' },
  headerSection: { marginBottom: 8 },
  nameBar: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1, color: COLORS.white, textAlign: 'center' },
  artworkFrame: { padding: 3, borderRadius: 8, marginBottom: 10, elevation: 2, backgroundColor: '#1E3A8A' },
  artworkContainer: { height: 300, borderRadius: 8, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  artwork: { width: '100%', height: '100%' },
  lockedImage: { opacity: 0.2 },
  placeholderArtwork: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#333' },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  lockIcon: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 16, padding: 10 },
  fabCamera: { position: 'absolute', right: 12, bottom: 12, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  typeSection: { paddingVertical: 6, paddingHorizontal: 8, marginBottom: 10, borderRadius: 6, position: 'relative', overflow: 'hidden' },
  typeLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', letterSpacing: 1, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  hologramStripe: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.5 },
  descriptionSection: { borderWidth: 1.5, borderRadius: 8, padding: 12, marginBottom: 12, minHeight: 140, maxHeight: 240, backgroundColor: '#FFFFFF', borderColor: '#8B4513' },
  descriptionText: { fontSize: 14, lineHeight: 20, textAlign: 'justify', includeFontPadding: false, paddingTop: 0, color: '#2F2F2F' },
  hiddenText: { fontSize: 14, lineHeight: 20, textAlign: 'center', includeFontPadding: false, paddingTop: 0, color: '#999', fontStyle: 'italic' },
  statsSection: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8D5B7', borderColor: '#8B4513' },
  statBox: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1.5, height: 22, marginHorizontal: 10, backgroundColor: '#8B4513' },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: '#2F2F2F', marginBottom: 2 },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#8B4513' },
  cornerDecor: { position: 'absolute', width: 10, height: 10, backgroundColor: '#DAA520', borderRadius: 2, transform: [{ rotate: '45deg' }] },
  topLeft: { top: 6, left: 6 },
  topRight: { top: 6, right: 6 },
  bottomLeft: { bottom: 6, left: 6 },
  bottomRight: { bottom: 6, right: 6 },
});
