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
      onSimilarObjectsResult?.(response);
      
      // La respuesta siempre será un array directo
      const similarCount = response.length;
      const similarObjects = response;
      
      console.log('Objetos similares encontrados:', similarObjects);
      
      if (similarCount > 0) {
        // Crear mensaje detallado con toda la información
        const detailMessage = similarObjects.map((obj: SimilarObject, index: number) => 
          `${index + 1}. 🎨 ${obj.name}\n` +
          `📝 ${obj.description.length > 100 ? obj.description.substring(0, 100) + '...' : obj.description}\n` +
          `🎯 Similitud: ${(obj.combined_score * 100).toFixed(1)}%\n` +
          `🏷️ Tipo: ${obj.type}\n` +
          `🆔 ID: ${obj.id}`
        ).join('\n\n');
        
        Alert.alert(
          'Objetos similares encontrados',
          `Se encontraron ${similarCount} objeto(s) similar(es):\n\n${detailMessage}`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Sin resultados',
          'No se encontraron objetos similares'
        );
      }
      
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
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
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