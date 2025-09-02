import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import { getGoals } from '@services/goals/getGoal';
import { getCulturalObjectInfo } from '@services/culturalObject/getCulturalObjectInfo';
import { getMuseumHistory } from '@services/Gemma/getMuseumHistory';
import { useToast } from '@hooks/useToast';
import { useLocationValidation } from '@hooks/useLocationValidation';
import { useGoalsCompletion } from '@hooks/useGoalsCompletion';
import Toast from '@components/common/Toast';

interface GoalsRouteParams {
  museumId: number;
  museumName: string;
  museumLocation?: { latitude: number; longitude: number; } | null;
  userLocation?: { latitude: number; longitude: number; } | null;
  objectClues?: { id: string; text: string }[]; // llega de AventureScreen
}

interface GoalObject {
  id: number;
  name: string;
  description: string;
  pictureUrls: string[];
  type: string;
  isDiscovered: boolean;
  clueTexts?: string[];
}

export default function GoalsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as GoalsRouteParams;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);
  const { toast, showCelebration, hideToast } = useToast();

  const [goalObjects, setGoalObjects] = useState<GoalObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [museumHistory, setMuseumHistory] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [goalId, setGoalId] = useState<number | null>(null); // ID de la meta

  // Hook para validar ubicación
  const { validateLocation, isValidatingLocation, isLocationValid } = useLocationValidation({
    museumId: params.museumId,
    userLocation: params.userLocation,
  });

  // Hook para verificar completación de metas
  const { isCompleted, checkGoalsCompletion } = useGoalsCompletion({
    museumId: params.museumId,
    museumName: params.museumName,
  });

  const fetchMuseumHistory = async () => {
    try {
      setIsLoadingHistory(true);
      console.log('[GoalsScreen] Obteniendo información del museo para meta:', params.museumId);
      
      const goalsResponse = await getGoals(params.museumId);
      const historyResponse = await getMuseumHistory(goalsResponse.id);
      
      console.log('[GoalsScreen] Información del museo obtenida:', historyResponse.data);
      setMuseumHistory(historyResponse.data);
      
    } catch (error) {
      console.error('[GoalsScreen] Error obteniendo información del museo:', error);
      // No mostrar error al usuario, solo log
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const clueMap = useMemo(() => {
    const map = new Map<number, string[]>();
    const clues = params?.objectClues ?? [];
    for (const c of clues) {
      const idNum = Number(String(c.id).trim());
      if (!Number.isFinite(idNum)) continue;
      const arr = map.get(idNum) ?? [];
      if (c.text?.trim()) arr.push(c.text.trim());
      map.set(idNum, arr);
    }
    return map;
  }, [params?.objectClues]);

  useEffect(() => {
    initializeGoals();
    fetchMuseumHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verificar completación de metas cuando cambian los objetos
  useEffect(() => {
    if (goalObjects.length > 0) {
      checkGoalsCompletion();
    }
  }, [goalObjects, checkGoalsCompletion]);

  const initializeGoals = async () => {
    try {
      setIsLoading(true);
      const goalsResponse = await getGoals(params.museumId);
      
      // Guardar el ID de la meta
      setGoalId(goalsResponse.id);
      console.log('[GoalsScreen] ID de meta obtenido:', goalsResponse.id);

      const objectsData: GoalObject[] = [];
      for (const culturalObject of goalsResponse.culturalObject) {
        try {
          const objectResponse = await getCulturalObjectInfo(culturalObject.id);
          const base: GoalObject = {
            id: objectResponse.data.id,
            name: objectResponse.data.name,
            description: objectResponse.data.description,
            pictureUrls: objectResponse.data.pictureUrls || [],
            type: objectResponse.data.type,
            isDiscovered: goalsResponse.found.includes(culturalObject.id),
          };

          const cluesForThis = clueMap.get(base.id);
          if (cluesForThis?.length) base.clueTexts = cluesForThis;

          objectsData.push(base);
        } catch (error) {
          console.error(`Error fetching object ${culturalObject.id}:`, error);
        }
      }

      setGoalObjects(objectsData);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'No se pudieron cargar las metas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleObjectPress = (object: GoalObject) => {
    console.log('[GoalsScreen] Navegando a GoalDetail con objeto:', object.id);
    console.log('[GoalsScreen] Información del museo disponible:', museumHistory);
    console.log('[GoalsScreen] GoalId disponible:', goalId);
    
    if (!goalId) {
      console.error('[GoalsScreen] No hay goalId disponible');
      Alert.alert('Error', 'No se pudo obtener la información de la meta');
      return;
    }
    
    // Se envían las pistas del objeto a la pantalla de detalle
    navigation.navigate('GoalDetail', {
      object,
      museumId: params.museumId,
      museumName: params.museumName,
      museumHistory, // Información del museo con pistas
      goalId: goalId, // ID de la meta (no del objeto)
    });
  };

  const handleQuizPress = async () => {
    setIsQuizLoading(true);
    try {
      // Obtener el ID de la meta correcto
      const goalsResponse = await getGoals(params.museumId);
      
      // Navegar a la pantalla de cuestionario con el ID de la meta
      navigation.navigate('Quiz', {
        museumId: params.museumId,
        museumName: params.museumName,
        goalId: goalsResponse.id, // Usar el ID de la meta correcto
      });
    } catch (error) {
      console.error('Error obteniendo ID de meta:', error);
      // Fallback: usar museumId si hay error
      navigation.navigate('Quiz', {
        museumId: params.museumId,
        museumName: params.museumName,
        goalId: params.museumId,
      });
    } finally {
      setIsQuizLoading(false);
    }
  };

  const renderGoalObject = (object: GoalObject) => {
    const hasClue = !!object.clueTexts?.length;
    const cluePreview = hasClue ? object.clueTexts![0] : '';
    const extraCount = hasClue && object.clueTexts!.length > 1 ? object.clueTexts!.length - 1 : 0;
    const descriptionToShow = hasClue ? cluePreview : (object.description ?? '');
    const showImage = object.isDiscovered && !!object.pictureUrls?.[0];

    return (
      <TouchableOpacity
        key={object.id}
        style={[
          styles.objectCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            shadowColor: COLORS.card.shadow,
          },
        ]}
        onPress={() => handleObjectPress(object)}
        activeOpacity={0.85}
      >
        <View style={styles.objectHeader}>
          <Text style={[styles.objectTitle, { color: colors.text }]}>{object.name}</Text>

          {object.isDiscovered ? (
            <View style={[styles.badgeUnlocked, { backgroundColor: colors.buttonBackground }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.buttonText} />
              <Text style={[styles.badgeText, { color: colors.buttonText }]}>DESCUBIERTO</Text>
            </View>
          ) : (
            <View style={[styles.badgeLocked, { borderColor: colors.buttonBackground }]}>
              <Ionicons name="lock-closed" size={16} color={colors.buttonBackground} />
              <Text style={[styles.badgeTextLocked, { color: colors.buttonBackground }]}>POR DESCUBRIR</Text>
            </View>
          )}
        </View>

        {showImage ? (
          <Image source={{ uri: object.pictureUrls[0] }} style={styles.objectImg} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.lockPanel,
              {
                borderColor: colors.buttonBackground,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              },
            ]}
          >
            <Ionicons name="lock-closed" size={36} color={colors.buttonBackground} />
            <Text style={[styles.lockText, { color: colors.buttonBackground }]}>POR DESCUBRIR</Text>
            <Text style={[styles.lockHint, { color: colors.textSecondary }]}>
              Encuentra pistas para desbloquear la imagen
            </Text>
          </View>
        )}

        <Text style={[styles.objectDesc, { color: colors.textSecondary }]}>
          {truncate(descriptionToShow, 220)}
        </Text>

        {hasClue && extraCount > 0 && (
          <Text style={[styles.moreClues, { color: colors.textSecondary }]}>
            +{extraCount} pista{extraCount > 1 ? 's' : ''} adicional{extraCount > 1 ? 'es' : ''}
          </Text>
        )}

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.objectType, { color: colors.textSecondary }]}>{object.type}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>METAS</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{params?.museumName}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Completa las metas o accede directamente al cuestionario
        </Text>
        
        {/* Botón de Cuestionario */}
        <TouchableOpacity
          style={[
            styles.quizButton, 
            { 
              backgroundColor: colors.buttonBackground,
              opacity: isQuizLoading ? 0.6 : 1
            }
          ]}
          onPress={handleQuizPress}
          disabled={isQuizLoading}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isQuizLoading ? "hourglass" : "help-circle"} 
            size={20} 
            color={colors.buttonText} 
          />
          <Text style={[styles.quizButtonText, { color: colors.buttonText }]}>
            {isQuizLoading ? 'Cargando...' : 'Cuestionario'}
          </Text>
        </TouchableOpacity>

        {/* Botón de Validar Ubicación */}
        <TouchableOpacity
          style={[
            styles.locationButton,
            { 
              backgroundColor: isLocationValid ? COLORS.success : colors.buttonBackground,
              opacity: isValidatingLocation ? 0.6 : 1
            }
          ]}
          onPress={validateLocation}
          disabled={isValidatingLocation}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isValidatingLocation ? "hourglass" : "location"} 
            size={20} 
            color={colors.buttonText} 
          />
          <Text style={[styles.locationButtonText, { color: colors.buttonText }]}>
            {isValidatingLocation ? 'Validando...' : 'Validar Ubicación'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color={colors.buttonBackground} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando metas...</Text>
          </View>
        ) : goalObjects.length > 0 ? (
          <View style={styles.objectsContainer}>
            {goalObjects.map((object) => renderGoalObject(object))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay metas disponibles</Text>
          </View>
        )}
      </ScrollView>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

function truncate(text: string, max = 160): string {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 50 ? cut.slice(0, lastSpace) : cut) + '…';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 18, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16 },

  objectsContainer: { paddingVertical: 16 },

  objectCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  objectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  objectTitle: { fontSize: 18, fontWeight: '700', flex: 1, paddingRight: 8 },

  badgeLocked: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1.5 },
  badgeUnlocked: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { marginLeft: 6, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  badgeTextLocked: { marginLeft: 6, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  objectImg: { width: '100%', height: 168, borderRadius: 10, marginBottom: 12 },

  lockPanel: { height: 168, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', marginBottom: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  lockText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  lockHint: { fontSize: 12, opacity: 0.85, textAlign: 'center' },

  objectDesc: { fontSize: 14, lineHeight: 20, textAlign: 'justify', includeFontPadding: false },
  moreClues: { marginTop: 6, fontSize: 12 },

  cardFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  objectType: { fontSize: 12, fontWeight: '700' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
});
