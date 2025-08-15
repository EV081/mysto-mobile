import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getObjectbyImage, ImageSearchResponse, ImageSearchResult } from '@services/imageRecognition/getObjectbyImage';
import { obtainCulturalObject, ObtainCulturalObjectError} from '@services/culturalObject/getObtainCulturalObject';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';

interface SearchByImageButtonProps {
  onSearchResult?: (results: ImageSearchResponse | ImageSearchResult[]) => void;
  onError?: (error: string) => void;
  onObjectFound?: (object: CulturalObjectResponse) => void;
  expectedObjectId?: number; // Nueva prop para especificar el ID esperado
  similarityThreshold?: number;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
}

export const SearchByImageButton: React.FC<SearchByImageButtonProps> = ({
  onSearchResult,
  onError,
  onObjectFound,
  expectedObjectId,
  similarityThreshold = 0.7,
  style,
  textStyle,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const selectImage = async (useCamera: boolean = false) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      };

      const result = useCamera 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        await searchByImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error(`Error al ${useCamera ? 'tomar foto' : 'seleccionar imagen'}:`, error);
      const errorMessage = `Error al ${useCamera ? 'acceder a la cámara' : 'seleccionar la imagen'}`;
      onError?.(errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige de dónde quieres obtener la imagen',
      [
        { text: 'Galería', onPress: () => selectImage(false) },
        { text: 'Cámara', onPress: () => selectImage(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const searchByImage = async (imageUri: string) => {
    try {
      setIsLoading(true);
      console.log('Iniciando búsqueda por imagen con URI:', imageUri);
      
      const response = await getObjectbyImage(imageUri, similarityThreshold);
      console.log('Búsqueda completada:', response);
      
      onSearchResult?.(response);
      
      // La respuesta siempre es un objeto único
      const result = extractSingleResult(response);
      
      if (result) {
        if (expectedObjectId) {
          await verifyExpectedObject(result, expectedObjectId);
        } else {
          showSuccessAlert(result);
        }
      } else {
        Alert.alert('Sin resultados', 'No se encontraron objetos similares a la imagen');
      }
      
    } catch (error: any) {
      console.error('Error en búsqueda por imagen:', error);
      handleSearchError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyExpectedObject = async (result: any, expectedId: number) => {
    try {
      if (result.id === expectedId) {
        console.log(`Objeto con ID ${expectedId} encontrado en el resultado. Obteniendo detalles...`);
        
        const culturalObject = await obtainCulturalObject(expectedId);
        
        onObjectFound?.(culturalObject);
        
        Alert.alert(
          '¡Objeto verificado!',
          `El objeto "${culturalObject.name || result.name}" fue encontrado y verificado correctamente.\n\n` +
          `Similitud: ${((result.similarity_score || result.similarity || 0) * 100).toFixed(1)}%`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Objeto no encontrado',
          `El objeto esperado (ID: ${expectedId}) no coincide con el resultado encontrado (ID: ${result.id}).\n\n` +
          `Objeto encontrado: "${result.name || result.nombre}"`,
          [
            {
              text: 'Ver resultado',
              onPress: () => showSuccessAlert(result)
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error al verificar objeto esperado:', error);
      
      // Manejar errores específicos del obtainCulturalObject
      const errorDetails = error.details as ObtainCulturalObjectError;
      let errorTitle = 'Error de verificación';
      let errorMessage = `Error al obtener detalles del objeto con ID ${expectedId}`;
      
      if (errorDetails) {
        switch (errorDetails.type) {
          case 'NOT_FOUND':
            errorTitle = 'Objeto no encontrado';
            errorMessage = `El objeto con ID ${expectedId} no existe en el sistema principal.\n\n¿Deseas ver el resultado de la búsqueda por imagen?`;
            break;
          case 'ALREADY_EXISTS':
            errorTitle = 'Conflicto de objeto';
            errorMessage = `Hay un conflicto con el objeto ID ${expectedId}. Puede que ya esté siendo procesado o exista un duplicado.`;
            break;
          case 'SERVER_ERROR':
            errorTitle = 'Error del servidor';
            errorMessage = 'Error interno del servidor al verificar el objeto. Intenta de nuevo más tarde.';
            break;
          default:
            errorMessage = errorDetails.message || errorMessage;
        }
      }
      
      onError?.(errorMessage);
      
      // Mostrar alerta diferente según el tipo de error
      if (errorDetails?.type === 'NOT_FOUND') {
        Alert.alert(
          errorTitle,
          errorMessage,
          [
            {
              text: 'Ver resultado de búsqueda',
              onPress: () => showSuccessAlert(result)
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(errorTitle, errorMessage);
      }
    }
  };

  const extractSingleResult = (response: any) => {
    // La respuesta siempre debería ser un objeto único
    if (Array.isArray(response) && response.length > 0) {
      return response[0]; // Tomar el primero si viene como array
    } else if (response && typeof response === 'object') {
      if (response.resultados && Array.isArray(response.resultados) && response.resultados.length > 0) {
        return response.resultados[0]; // Tomar el primer resultado si viene en formato wrapper
      } else if (response.id && response.name) {
        return response; // Es un objeto directo
      }
    }
    return null; // No se encontró resultado válido
  };

  const showSuccessAlert = (result: any) => {
    const detailMessage = 
      `🎨 ${result.name || result.nombre}\n` +
      `📝 ${result.description || result.descripcion || 'Sin descripción'}\n` +
      `🎯 Similitud: ${((result.similarity_score || result.similarity || 0) * 100).toFixed(1)}%\n` +
      `🏷️ Tipo: ${result.type || 'No especificado'}\n` +
      `🆔 ID: ${result.id}`;
    
    Alert.alert(
      'Objeto encontrado',
      `Se encontró el siguiente objeto:\n\n${detailMessage}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleSearchError = (error: any) => {
    let errorMessage = 'Error al buscar objetos similares';
    
    if (error.response?.status === 404) {
      errorMessage = `No se encontraron objetos con similitud mayor al ${(similarityThreshold * 100)}%`;
    } else if (error.response?.data?.mensaje) {
      errorMessage = error.response.data.mensaje;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    onError?.(errorMessage);
    Alert.alert('Sin resultados', errorMessage);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.buttonDisabled]}
      onPress={showImageSourceOptions}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {isLoading && (
          <ActivityIndicator size="small" color="#fff" style={styles.loader} />
        )}
        <Text style={[styles.buttonText, textStyle, disabled && styles.textDisabled]}>
          {isLoading ? 'Buscando...' : 'Buscar por Imagen'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
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

export default SearchByImageButton;