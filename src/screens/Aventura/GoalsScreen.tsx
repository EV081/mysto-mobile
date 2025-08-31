import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import { startGoals } from '@services/goals/startGoal';
import { getGoals } from '@services/goals/getGoal';
import { getCulturalObjectInfo } from '@services/culturalObject/getCulturalObjectInfo';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { GoalResponseDto } from '@interfaces/goal/goalResponse';

interface GoalsRouteParams {
  museumId: number;
  museumName: string;
  museumLocation?: { latitude: number; longitude: number; } | null;
  userLocation?: { latitude: number; longitude: number; } | null;
}

interface GoalObject {
  id: number;
  name: string;
  description: string;
  pictureUrls: string[];
  type: string;
  isDiscovered: boolean;
}

export default function GoalsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as GoalsRouteParams;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [goalObjects, setGoalObjects] = useState<GoalObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeGoals();
  }, []);

  const initializeGoals = async () => {
    try {
      setIsLoading(true);
      
      // Intentar iniciar las metas (puede fallar si ya están iniciadas o si no está cerca)
      if (params?.museumId && params?.userLocation) {
        try {
          await startGoals(
            params.museumId,
            params.userLocation.latitude,
            params.userLocation.longitude
          );
        } catch (error: any) {
          // Verificar si es un error de distancia
          if (error.response?.status === 403 && 
              error.response?.data?.message?.includes('metros')) {
            Alert.alert(
              'Demasiado Lejos',
              'Debes estar a menos de 20 metros del museo para iniciar las metas.',
              [{ text: 'Entendido' }]
            );
            return;
          }
          // Si falla por otra razón, probablemente ya están iniciadas
          console.log('Goals may already be started or other error:', error.message);
        }
      }

      // Obtener las metas
      const goalsResponse = await getGoals(params.museumId);
      
      // Obtener información de cada objeto cultural
      const objectsData: GoalObject[] = [];
      for (const culturalObject of goalsResponse.culturalObject) {
        try {
          const objectResponse = await getCulturalObjectInfo(culturalObject.id);
          objectsData.push({
            id: objectResponse.data.id,
            name: objectResponse.data.name,
            description: objectResponse.data.description,
            pictureUrls: objectResponse.data.pictureUrls || [],
            type: objectResponse.data.type,
            isDiscovered: goalsResponse.found.includes(culturalObject.id),
          });
        } catch (error) {
          console.error(`Error fetching object ${culturalObject.id}:`, error);
        }
      }
      
      setGoalObjects(objectsData);
    } catch (error) {
      console.error('Error initializing goals:', error);
      Alert.alert('Error', 'No se pudieron cargar las metas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleObjectPress = (object: GoalObject) => {
    navigation.navigate('GoalDetail', {
      object,
      museumId: params.museumId,
      museumName: params.museumName,
    });
  };

  const renderGoalObject = (object: GoalObject, index: number) => (
    <TouchableOpacity
      key={object.id}
      style={[styles.objectCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={() => handleObjectPress(object)}
    >
      <View style={styles.objectHeader}>
        <Text style={[styles.objectTitle, { color: colors.text }]}>
          {object.name}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
      
      <View style={styles.sealContainer}>
        <View style={styles.seal}>
          <Ionicons name="lock-closed" size={32} color={COLORS.button.primary} />
          <Text style={styles.sealText}>POR DESCUBRIR</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>METAS</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {params?.museumName}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color={COLORS.button.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando metas...
            </Text>
          </View>
        ) : goalObjects.length > 0 ? (
          <View style={styles.objectsContainer}>
            {goalObjects.map((object, index) => renderGoalObject(object, index))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay metas disponibles
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  objectsContainer: {
    paddingVertical: 16,
  },
  objectCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  objectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  objectTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  sealContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  seal: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.button.primary,
    borderStyle: 'dashed',
  },
  sealText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.button.primary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
