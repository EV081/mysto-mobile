import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import { useToast } from './useToast';

export const useMuseumUtils = () => {
  const { showWarning } = useToast();

  // Función para formatear hora
  const formatHour = useCallback((time?: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  }, []);

  // Función para abrir en mapas
  const openInMaps = useCallback((lat: number | string, lon: number | string) => {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      showWarning('Coordenadas inválidas');
      return;
    }
    
    const url = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${latNum},${lonNum}`
      : `geo:${latNum},${lonNum}?q=${latNum},${lonNum}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        showWarning('No se pudo abrir el mapa');
      }
    });
  }, [showWarning]);

  // Función para convertir objeto cultural a formato de álbum
  const convertToAlbumItem = useCallback((item: any) => {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      pictureUrls: item.pictureUrls,
      isObtained: true, 
    };
  }, []);

  return {
    formatHour,
    openInMaps,
    convertToAlbumItem,
  };
}; 