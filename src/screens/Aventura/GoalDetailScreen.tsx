import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getThemeColors, COLORS } from '@constants/colors';
import AlbumItem from '@components/Album/AlbumItem';
import { validateGoal } from '@services/goals/validateGoal';
import { AlbumResponseDto } from '@interfaces/album/AlbumResponse';

interface GoalDetailRouteParams {
  object: {
    id: number;
    name: string;
    description: string;
    pictureUrls: string[];
    type: string;
    isDiscovered: boolean;
  };
  museumId: number;
  museumName: string;
}

export default function GoalDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as GoalDetailRouteParams;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [isValidating, setIsValidating] = useState(false);

  const handleCameraPress = async () => {
    Alert.alert(
      'Validar Objeto',
      '¿Quieres tomar una foto para validar este objeto cultural?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: validateObject }
      ]
    );
  };

  const validateObject = async () => {
    setIsValidating(true);
    try {
      // Aquí se implementaría la lógica de la cámara
      // Por ahora simulamos la validación
      Alert.alert(
        'Funcionalidad en Desarrollo',
        'La funcionalidad de cámara y validación estará disponible próximamente.',
        [{ text: 'Entendido' }]
      );
      
      // Ejemplo de cómo sería la validación:
      // const imageFile = await takePhoto();
      // const result = await validateGoal(params.object.id, imageFile);
      // if (result === 'success') {
      //   Alert.alert('¡Éxito!', 'Objeto validado correctamente');
      //   navigation.goBack();
      // }
    } catch (error) {
      Alert.alert('Error', 'No se pudo validar el objeto');
    } finally {
      setIsValidating(false);
    }
  };

  const albumItem: AlbumResponseDto = {
    id: params.object.id,
    name: params.object.name,
    description: params.object.description,
    type: params.object.type,
    pictureUrls: params.object.pictureUrls,
    isObtained: false,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pistas</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={[styles.panel, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Panel de Pistas</Text>
          <Text style={[styles.panelText, { color: colors.textSecondary }]}>
            Este es un texto de ejemplo para las pistas. Aquí se mostrarán las indicaciones 
            que ayudarán al usuario a encontrar el objeto cultural en el museo. 
            Las pistas pueden incluir descripciones de ubicación, características 
            específicas del objeto, o información histórica relevante.
          </Text>
        </View>

        <View style={styles.objectSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Objeto por Descubrir</Text>
          
          <View style={styles.objectContainer}>
            <View style={styles.albumContainer}>
              <AlbumItem item={albumItem} isObtained={false} />
            </View>
            
            <TouchableOpacity
              style={[
                styles.cameraButton,
                { backgroundColor: COLORS.button.primary },
                isValidating && styles.cameraButtonDisabled
              ]}
              onPress={handleCameraPress}
              disabled={isValidating}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.cameraButtonText}>
                {isValidating ? 'Validando...' : 'Validar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  panel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  panelText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  objectSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  objectContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  albumContainer: {
    flex: 1,
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
  },
  cameraButtonDisabled: {
    opacity: 0.6,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
