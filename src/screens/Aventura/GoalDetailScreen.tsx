import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getThemeColors, COLORS } from '@constants/colors';
import { useToast } from '@hooks/useToast';
import { useLocationValidation } from '@hooks/useLocationValidation';
import { getObjectbyImage } from '@services/imageRecognition/getObjectbyImage';
import { validateGoal } from '@services/goals/validateGoal';
import { getGoals } from '@services/goals/getGoal';
import Toast from '@components/common/Toast';

interface GoalDetailRouteParams {
  object: {
    id: number;
    name: string;
    description: string;
    pictureUrls: string[];
    type: string;
    isDiscovered: boolean;
    clueTexts?: string[]; // ✅ pistas por objeto (llegan desde GoalsScreen)
  };
  museumId: number;
  museumName: string;
  museumHistory?: any; // Nueva información del museo con pistas
  goalId?: number; // ID de la meta
}

export default function GoalDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as GoalDetailRouteParams;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const { toast, showCelebration, showError, hideToast } = useToast();

  const [isValidating, setIsValidating] = useState(false);
  const [wasDiscovered, setWasDiscovered] = useState(params.object.isDiscovered);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [objectDetails, setObjectDetails] = useState<any>(null);
  const [goalId, setGoalId] = useState<number | null>(params.goalId || null);
  const [museumHistory, setMuseumHistory] = useState<any>(params.museumHistory || null);

  // Hook para validar ubicación
  const { validateLocation, isValidatingLocation, isLocationValid } = useLocationValidation({
    museumId: params.museumId,
    userLocation,
  });

  // Obtener el ID de la meta al cargar el componente (solo si no se pasó desde GoalsScreen)
  useEffect(() => {
    console.log('[GoalDetailScreen] Parámetros recibidos:', {
      objectId: params.object.id,
      museumId: params.museumId,
      goalId: params.goalId,
      museumHistory: params.museumHistory ? 'Disponible' : 'No disponible'
    });
    
    console.log('[GoalDetailScreen] Estado inicial goalId:', goalId);
    
    const fetchGoalId = async () => {
      // Si ya tenemos el goalId desde GoalsScreen, no hacer nada
      if (goalId) {
        console.log('[GoalDetailScreen] GoalId ya disponible desde GoalsScreen:', goalId);
        return;
      }
      
      try {
        console.log('[GoalDetailScreen] Obteniendo ID de meta para museo:', params.museumId);
        const goalsResponse = await getGoals(params.museumId);
        setGoalId(goalsResponse.id);
        console.log('[GoalDetailScreen] ID de meta obtenido:', goalsResponse.id);
        console.log('[GoalDetailScreen] Objetos de la meta:', goalsResponse.culturalObject);
        console.log('[GoalDetailScreen] Objetos encontrados:', goalsResponse.found);
      } catch (error) {
        console.error('[GoalDetailScreen] Error obteniendo ID de meta:', error);
        // Fallback: usar museumId si hay error
        setGoalId(params.museumId);
        console.log('[GoalDetailScreen] Usando museumId como fallback:', params.museumId);
      }
    };
    
    fetchGoalId();
  }, [params.museumId, goalId]);

  const requestCameraPermission = async () => {
    console.log('[GoalDetailScreen] Solicitando permisos de cámara...');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[GoalDetailScreen] Estado de permisos de cámara:', status);
    
    if (status !== 'granted') {
      Alert.alert(
        'Permisos de Cámara',
        'Se necesitan permisos de cámara para validar el objeto.',
        [{ text: 'Entendido' }]
      );
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    console.log('[GoalDetailScreen] Abriendo cámara...');
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.log('[GoalDetailScreen] Permisos de cámara denegados');
      return null;
    }

    try {
      console.log('[GoalDetailScreen] Lanzando cámara...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('[GoalDetailScreen] Resultado de cámara:', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('[GoalDetailScreen] Imagen capturada:', result.assets[0].uri);
        return result.assets[0].uri;
      } else {
        console.log('[GoalDetailScreen] Captura cancelada o sin imagen');
      }
    } catch (error) {
      console.error('[GoalDetailScreen] Error abriendo cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
    return null;
  };

  const validateObjectImage = async (imageUri: string) => {
    if (!goalId) {
      console.error('[GoalDetailScreen] No hay ID de meta disponible');
      showError('Error: No se pudo obtener el ID de la meta');
      return false;
    }

    try {
      console.log('[GoalDetailScreen] Validando objeto con imagen, objectId:', params.object.id);
      console.log('[GoalDetailScreen] URI de imagen:', imageUri);
      
      // Validar el objeto con la imagen capturada usando el ID del objeto específico
      const validationResult = await getObjectbyImage(params.object.id, imageUri, 0.5);
      
      console.log('[GoalDetailScreen] Resultado de validación:', validationResult);
      
      if (validationResult && validationResult.object) {
        console.log('[GoalDetailScreen] Objeto validado exitosamente:', validationResult.object.name);
        console.log('[GoalDetailScreen] Puntuación de similitud:', validationResult.similarity_score);
        
        // Si la validación es exitosa, guardar los detalles del objeto
        setObjectDetails(validationResult.object);
        setWasDiscovered(true);
        
        // Validar la meta con el ID del objeto encontrado
        try {
          console.log('[GoalDetailScreen] Validando meta con objeto ID:', validationResult.object.id);
          console.log('[GoalDetailScreen] Meta ID para validación:', goalId);
          console.log('[GoalDetailScreen] Verificando goalId antes de validar:', goalId);
          
          if (!goalId) {
            throw new Error('No hay goalId disponible para validar la meta');
          }
          
          await validateGoal(goalId, validationResult.object.id);
          console.log('[GoalDetailScreen] Meta validada exitosamente');
          
          // Solo mostrar toast de éxito cuando la meta se valide correctamente
          showCelebration(`¡Objeto desbloqueado! ${validationResult.object.name} (Similitud: ${(validationResult.similarity_score * 100).toFixed(1)}%)`);
          
        } catch (goalError: any) {
          console.error('[GoalDetailScreen] Error validando meta:', goalError);
          console.error('[GoalDetailScreen] Detalles del error de meta:', {
            status: goalError?.response?.status,
            data: goalError?.response?.data,
            message: goalError?.message
          });
          // Mostrar error específico de validación de meta
          if (goalError?.response?.status === 404) {
            showError('Objeto validado pero no se pudo actualizar la meta. Contacta al administrador.');
          } else {
            showError('Objeto validado pero error al actualizar la meta. Intenta de nuevo.');
          }
        }
        
        return true;
      }
    } catch (error: any) {
      console.error('[GoalDetailScreen] Error validando objeto:', error);
      console.error('[GoalDetailScreen] Detalles del error:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      
      if (error?.response?.status === 404) {
        const errorMessage = error?.response?.data?.detail || 'La imagen no coincide con este objeto. Intenta con otra imagen.';
        console.log('[GoalDetailScreen] Mostrando error 404:', errorMessage);
        showError(errorMessage);
      } else {
        const errorMessage = error?.response?.data?.detail || 'No se pudo validar el objeto. Intenta de nuevo.';
        console.log('[GoalDetailScreen] Mostrando error genérico:', errorMessage);
        showError(errorMessage);
      }
    }
    return false;
  };

  const handleCameraPress = async () => {
    console.log('[GoalDetailScreen] Botón de cámara presionado');
    console.log('[GoalDetailScreen] Estado actual - wasDiscovered:', wasDiscovered, 'goalId:', goalId);
    
    if (wasDiscovered) {
      console.log('[GoalDetailScreen] Objeto ya descubierto, mostrando alerta');
      Alert.alert(
        'Objeto ya descubierto',
        'Este objeto ya ha sido descubierto.',
        [{ text: 'Entendido' }],
      );
      return;
    }

    if (!goalId) {
      console.error('[GoalDetailScreen] No hay ID de meta disponible');
      showError('Error: No se pudo obtener el ID de la meta');
      return;
    }

    try {
      setIsValidating(true);
      console.log('[GoalDetailScreen] Iniciando proceso de validación...');
      
      // Abrir cámara y capturar imagen
      console.log('[GoalDetailScreen] Abriendo cámara...');
      const imageUri = await openCamera();
      
      if (!imageUri) {
        console.log('[GoalDetailScreen] No se capturó imagen');
        setIsValidating(false);
        return;
      }

      console.log('[GoalDetailScreen] Imagen capturada, procediendo a validar...');
      console.log('[GoalDetailScreen] URI de imagen capturada:', imageUri);
      
      // Validar la imagen capturada
      const isValid = await validateObjectImage(imageUri);
      
      if (isValid) {
        console.log('[GoalDetailScreen] Objeto validado exitosamente');
      } else {
        console.log('[GoalDetailScreen] Objeto no válido');
      }
      
    } catch (error) {
      console.error('[GoalDetailScreen] Error en proceso de cámara:', error);
      showError('Error al procesar la imagen');
    } finally {
      console.log('[GoalDetailScreen] Finalizando proceso de validación');
      setIsValidating(false);
    }
  };

  // Texto de pistas (o fallback)
  const cluesText = useMemo(() => {
    const clues = params.object.clueTexts?.filter(t => !!t?.trim()) ?? [];
    if (!clues.length) return '';
    return clues.map(t => `• ${t.trim()}`).join('\n\n');
  }, [params.object.clueTexts]);

  // ⚠️ CAMBIADO: ahora SIEMPRE prioriza mostrar las PISTAS que vienen de GoalsScreen.
  // Si no hay pistas, usa description; si tampoco hay, muestra un fallback.
  const effectiveText =
    (cluesText && cluesText.trim().length)
      ? cluesText
      : (objectDetails?.description || params.object.description?.trim() || 'No hay pistas disponibles por ahora.');

  // Verificar si el objeto se acaba de desbloquear
  const isObjectDiscovered = wasDiscovered || params.object.isDiscovered;
  
  // Usar los detalles del objeto validado si están disponibles
  const finalObjectDetails = objectDetails || params.object;

  // Config visual por tipo (similar a AlbumItem)
  const cardConfig = useMemo(() => {
    // Asegurar que el tipo sea un string válido
    const typeStr = String(finalObjectDetails.type || '').toUpperCase();
    
    if (typeStr.includes('CERAM') || typeStr.includes('1')) {
      return {
        frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [string, string, ...string[]],
        borderColor: '#654321',
        typeText: 'CERÁMICA',
        holo: ['#8B4513', '#CD853F'] as [string, string],
      };
    }
    if (typeStr.includes('TEXTIL') || typeStr.includes('3')) {
      return {
        frameColors: ['#800080', '#DA70D6', '#DDA0DD'] as [string, string, ...string[]],
        borderColor: '#4B0082',
        typeText: 'TEXTIL',
        holo: ['#800080', '#DDA0DD'] as [string, string],
      };
    }
    if (typeStr.includes('PAINT') || typeStr.includes('PINTUR') || typeStr.includes('2')) {
      return {
        frameColors: ['#4169E1', '#6495ED', '#87CEEB'] as [string, string, ...string[]],
        borderColor: '#191970',
        typeText: 'PINTURA',
        holo: ['#4169E1', '#87CEEB'] as [string, string],
      };
    }
    if (typeStr.includes('GOLD') || typeStr.includes('ORFEB') || typeStr.includes('4')) {
      return {
        frameColors: ['#DAA520', '#FFD700', '#FFF8DC'] as [string, string, ...string[]],
        borderColor: '#B8860B',
        typeText: 'ORFEBRERÍA',
        holo: ['#DAA520', '#FFF8DC'] as [string, string],
      };
    }
    return {
      frameColors: ['#8B4513', '#D2691E', '#CD853F'] as [string, string, ...string[]],
      borderColor: '#654321',
      typeText: 'OBJETO',
      holo: ['#8B4513', '#CD853F'] as [string, string],
    };
  }, [finalObjectDetails.type]);

  // Estrellas decorativas (mismo espíritu que AlbumItem)
  const valueStars  = isObjectDiscovered ? '★★★★' : '????';
  const rarityStars = isObjectDiscovered ? '★★★'  : '???';

  const titleToShow = (isObjectDiscovered ? finalObjectDetails.name : '???').toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

      {/* Card a pantalla completa */}
      <View style={styles.content}>
        <View style={[styles.cardContainer, { shadowColor: COLORS.card.shadow }]}>
          <LinearGradient
            colors={cardConfig.frameColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardFrame}
          >
            <View style={[
              styles.innerBorder,
              { borderColor: cardConfig.borderColor, backgroundColor: colors.cardBackground }
            ]}>
              {/* Nombre */}
              <View style={styles.headerSection}>
                <LinearGradient colors={['#2C2C2C', '#1A1A1A']} style={styles.nameBar}>
                  <Text style={styles.cardName} numberOfLines={1}>{titleToShow}</Text>
                </LinearGradient>
              </View>

              {/* Imagen / lock + FAB */}
              <View style={[styles.artworkFrame, { backgroundColor: COLORS.blue[800] }]}>
                <View style={styles.artworkContainer}>
                  {(wasDiscovered || params.object.isDiscovered) && (objectDetails?.url_image || params.object.pictureUrls?.[0]) ? (
                    <Image 
                      source={{ uri: objectDetails?.url_image || params.object.pictureUrls[0] }} 
                      style={styles.artwork} 
                      resizeMode="cover" 
                    />
                  ) : (
                    <View style={[styles.placeholderArtwork, { backgroundColor: isDark ? COLORS.gray[800] : COLORS.gray[300] }]}>
                      <Ionicons name="image-outline" size={40} color={isDark ? COLORS.gray[300] : COLORS.gray[600]} />
                      {!(wasDiscovered || params.object.isDiscovered) && (
                        <>
                          <View style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={16} color={COLORS.white} />
                          </View>
                          <Text style={styles.lockText}>POR DESCUBRIR</Text>
                          <Text style={styles.cameraHint}>Toca la cámara para validar</Text>
                        </>
                      )}
                    </View>
                  )}

                  {/* FAB cámara */}
                  <TouchableOpacity
                    onPress={handleCameraPress}
                    disabled={isValidating}
                    style={[
                      styles.fabCamera,
                      { backgroundColor: colors.buttonBackground, opacity: isValidating ? 0.6 : 1 },
                    ]}
                    activeOpacity={0.9}
                  >
                    {isValidating ? (
                      <Ionicons name="hourglass" size={22} color={colors.buttonText} />
                    ) : (
                      <Ionicons name="camera" size={22} color={colors.buttonText} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tipo */}
              <View style={[styles.typeSection, { backgroundColor: cardConfig.borderColor }]}>
                <Text style={styles.typeLabel}>[{cardConfig.typeText}]</Text>
                <LinearGradient
                  colors={cardConfig.holo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.hologramStripe}
                />
              </View>

              {/* Descripción / Pistas */}
              <View style={[styles.descriptionSection, { borderColor: cardConfig.borderColor, backgroundColor: colors.cardBackground }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.descriptionText, { color: colors.text }]}>{effectiveText}</Text>
                </ScrollView>
              </View>

              {/* Stats decorativas */}
              <View style={[styles.statsSection, { backgroundColor: COLORS.gray[100], borderColor: cardConfig.borderColor }]}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>VAL</Text>
                  <Text style={[styles.statValue, { color: cardConfig.borderColor }]}>{valueStars}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: cardConfig.borderColor }]} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>RAR</Text>
                  <Text style={[styles.statValue, { color: cardConfig.borderColor }]}>{rarityStars}</Text>
                </View>
              </View>

              {/* Esquinas decorativas */}
              <View style={[styles.cornerDecor, styles.topLeft]} />
              <View style={[styles.cornerDecor, styles.topRight]} />
              <View style={[styles.cornerDecor, styles.bottomLeft]} />
              <View style={[styles.cornerDecor, styles.bottomRight]} />
            </View>
          </LinearGradient>
        </View>
      </View>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

/* ====== styles ====== */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', maxWidth: '70%', textAlign: 'center' },

  content: { flex: 1, padding: 8 },

  cardContainer: {
    flex: 1,
    margin: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    borderRadius: 12,
  },
  cardFrame: { borderRadius: 12, padding: 4, flex: 1 },
  innerBorder: { flex: 1, borderWidth: 2.5, borderRadius: 10, padding: 8, position: 'relative' },

  headerSection: { marginBottom: 8 },
  nameBar: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6 },
  cardName: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1, color: COLORS.white, textAlign: 'center' },

  artworkFrame: { padding: 3, borderRadius: 8, marginBottom: 10, elevation: 2 },
  artworkContainer: { height: 300, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  artwork: { width: '100%', height: '100%' },
  placeholderArtwork: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  lockText: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    color: COLORS.white,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 12,
  },
  cameraHint: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    color: COLORS.white,
    fontSize: 10,
    opacity: 0.8,
    textAlign: 'center',
  },

  fabCamera: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  typeSection: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  typeLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', letterSpacing: 1 },
  hologramStripe: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.5 },

  descriptionSection: { borderWidth: 1.5, borderRadius: 8, padding: 12, marginBottom: 12, minHeight: 140, maxHeight: 240 },
  descriptionText: { fontSize: 14, lineHeight: 20, textAlign: 'justify', includeFontPadding: false, paddingTop: 0 },

  statsSection: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1.5, height: 22, marginHorizontal: 10 },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  statValue: { fontSize: 12, fontWeight: 'bold' },

  cornerDecor: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#DAA520',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  topLeft: { top: 6, left: 6 },
  topRight: { top: 6, right: 6 },
  bottomLeft: { bottom: 6, left: 6 },
  bottomRight: { bottom: 6, right: 6 },
});
