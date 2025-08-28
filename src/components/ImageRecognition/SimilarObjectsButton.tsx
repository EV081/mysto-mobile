import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { getSimilarObjectbyId, SimilarObject } from '@services/imageRecognition/getSimilarObjectsbyId';
import { COLORS } from '@constants/colors';

interface SimilarObjectsButtonProps {
  objectId: number;
  objectName: string;
  onSimilarObjectsResult?: (results: SimilarObject[]) => void;
  onError?: (error: string) => void;
  topK?: number;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
}

export const SimilarObjectsButton: React.FC<SimilarObjectsButtonProps> = ({
  objectId,
  objectName,
  onSimilarObjectsResult,
  onError,
  topK = 3,
  style,
  textStyle,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const searchSimilarObjects = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando búsqueda de objetos similares para :', objectName);
      
      const response = await getSimilarObjectbyId(objectId, topK);
      
  console.log('Búsqueda de similares completada:', response);
  // Pass results to parent for rendering; no alert UI here
  onSimilarObjectsResult?.(response);
      
    } catch (error: any) {
      console.error('Error en búsqueda de objetos similares:', error);
      let errorMessage = 'Error al buscar objetos similares';
      
      if (error.response?.status === 404) {
        errorMessage = `El objeto con ID ${objectId} no fue encontrado en la base de datos`;
      } else if (error.response?.status === 500) {
        // Error del servidor, posiblemente por problema cargando imágenes
        errorMessage = 'Error interno del servidor. Verifique que las imágenes sean accesibles';
      } else if (error.response?.data?.mensaje) {
        errorMessage = error.response.data.mensaje;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
      Alert.alert('Error de búsqueda', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (!objectId || objectId <= 0) {
      const errorMessage = 'ID de objeto no válido';
      onError?.(errorMessage);
      Alert.alert('Error', 'Debe proporcionarse un ID de objeto válido');
      return;
    }

    Alert.alert(
      'Buscar objetos similares',
      `¿Deseas buscar objetos similares para "${objectName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Buscar',
          onPress: searchSimilarObjects,
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled || isLoading || !objectId || objectId <= 0}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" style={styles.loader} />
        ) : null}
        <Text style={[styles.buttonText, textStyle, disabled && styles.textDisabled]}>
          {isLoading ? 'Buscando...' : 'Objetos Similares'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    backgroundColor: COLORS.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textDisabled: {
    color: '#D0D0D0',
  },
  loader: {
    marginRight: 8,
  },
});

export default SimilarObjectsButton;