import React, { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, View, Alert, Button, Linking, Platform } from "react-native";
import MapView, { 
  UrlTile, 
  Marker, 
  Region, 
  PROVIDER_GOOGLE,
  Callout 
} from "react-native-maps";
import * as Location from "expo-location";
import { getPagedMuseums } from "@services/museum/getListarMuseums";
import type { MuseumResponse } from "@interfaces/museum/MuseumResponse";
import { useNavigation } from "@react-navigation/native";
import { Text, Pressable } from "react-native";
import { useMuseumUtils } from "@hooks/useMuseumUtils";
import Ionicons from 'react-native-vector-icons/Ionicons';

// Interfaz para los resultados de búsqueda
interface SearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

// Props del componente
interface MapaBaseProps {
  searchResults?: SearchResult[];
  onSearchResultPress?: (result: SearchResult) => void;
}

export default function MapaBase({ searchResults = [], onSearchResultPress }: MapaBaseProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [museums, setMuseums] = useState<MuseumResponse[]>([]);
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const navigation = useNavigation();
  const { openInMaps } = useMuseumUtils();
  const mapRef = useRef<MapView>(null);
  
  const defaultRegion: Region = {
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Solicitar ubicación
  const getUserLocation = async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        setLocationPermission('granted');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const newUserLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        
        setUserLocation(newUserLocation);
        
        // Solo actualizar la región inicial si es la primera vez
        if (!region) {
          setRegion({
            latitude: newUserLocation.latitude,
            longitude: newUserLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
        
        return newUserLocation;
      } else {
        setLocationPermission('denied');
        setUserLocation(null);
        
        // Si es la primera vez, establecer la región por defecto
        if (!region) {
          setRegion(defaultRegion);
        }
        
        // Mostrar alerta solo si no se puede volver a preguntar
        if (!canAskAgain) {
          Alert.alert(
            "Permiso denegado permanentemente",
            "Para usar la funcionalidad de ubicación, debes habilitarla manualmente en Configuración.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Abrir configuración",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        } else {
          // Mostrar alerta informativa pero no intrusiva
          Alert.alert(
            "Ubicación no disponible",
            "Se usará Lima como ubicación por defecto. Puedes habilitar la ubicación en Configuración cuando quieras.",
            [
              { text: "Entendido", style: "default" },
              {
                text: "Configuración",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        }
        
        return null;
      }
    } catch (error) {
      console.error("Error al obtener ubicación:", error);
      setLocationPermission('denied');
      setUserLocation(null);
      
      // Si es la primera vez, establecer la región por defecto
      if (!region) {
        setRegion(defaultRegion);
      }
      
      Alert.alert(
        "Error de ubicación",
        "No se pudo obtener tu ubicación. Se usará Lima como ubicación por defecto.",
        [{ text: "Entendido", style: "default" }]
      );
      
      return null;
    }
  };

  // Función para hacer focus en la ubicación del usuario
  const focusOnUserLocation = useCallback(async () => {
    // Si no hay permisos, solicitar permisos primero
    if (locationPermission === 'denied') {
      await getUserLocation();
      return;
    }
    
    // Si no hay ubicación pero hay permisos, obtener ubicación
    if (!userLocation && locationPermission === 'granted') {
      const location = await getUserLocation();
      if (!location) return;
    }
    
    // Si hay ubicación, hacer focus
    if (userLocation && mapRef.current) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01, // Zoom más cercano para focus
        longitudeDelta: 0.01,
      };
      
      // Animar el mapa hacia la ubicación del usuario
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [userLocation, locationPermission]);

  // Función para hacer focus en un resultado de búsqueda
  const focusOnSearchResult = useCallback((result: SearchResult) => {
    if (mapRef.current) {
      const newRegion = {
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      mapRef.current.animateToRegion(newRegion, 1000);
    }
    
    // Llamar al callback si existe
    onSearchResultPress?.(result);
  }, [onSearchResultPress]);

  // Consultar museos
  const fetchMuseums = async () => {
    try {
      const data = await getPagedMuseums(0, 50);
      setMuseums(data.contents);
    } catch (error) {
      console.error("Error al obtener museos:", error);
      Alert.alert("Error", "No se pudieron cargar los museos.");
    }
  };

  // Al montar
  useEffect(() => {
    // Cargar museos inmediatamente
    fetchMuseums();
    
    // Establecer región por defecto inmediatamente para que el mapa se cargue
    if (!region) {
      setRegion(defaultRegion);
    }
    
    // Solicitar permisos de ubicación de forma no bloqueante
    getUserLocation();
  }, []);

  // Navegación al tocar un museo
  const handleMuseumPress = useCallback(
    (museum: MuseumResponse) => {
      setSelectedMuseum(museum);
    },
    []
  );

  // Función para ir al museo (mostrar direcciones)
  const handleGoToMuseum = useCallback(() => {
    if (selectedMuseum) {
      openInMaps(selectedMuseum.latitude, selectedMuseum.longitude);
    }
  }, [selectedMuseum, openInMaps]);

  // Función para comenzar aventura
  const handleStartAdventure = useCallback(() => {
    if (selectedMuseum) {
      // Preparar los datos para enviar a la pantalla de aventura
      const adventureData = {
        museumId: selectedMuseum.id,
        museumLocation: {
          latitude: selectedMuseum.latitude,
          longitude: selectedMuseum.longitude,
          name: selectedMuseum.name
        },
        userLocation: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        } : null,
        hasUserLocation: locationPermission === 'granted' && userLocation !== null
      };
      
      (navigation as any).navigate("Aventura", adventureData);
      setSelectedMuseum(null); // Ocultar la tarjeta después de navegar
    }
  }, [selectedMuseum, userLocation, locationPermission, navigation]);

  // Función para cerrar la tarjeta
  const handleCloseCard = useCallback(() => {
    setSelectedMuseum(null);
  }, []);

  // Función para ir a la información del museo
  const handleMuseumInfo = useCallback((museum: MuseumResponse) => {
    if (museum) {
      (navigation as any).navigate("MuseumforOneScreen", { 
        museumId: museum.id,
        onMuseumDeleted: () => {
          // Recargar la lista de museos en el mapa si es necesario
          fetchMuseums();
        }
      });
      setSelectedMuseum(null); // Ocultar la tarjeta después de navegar
    }
  }, [navigation, fetchMuseums]);

  return (
    <View style={styles.container}>
      {region && (
        <>
          <MapView 
            ref={mapRef}
            style={styles.map} 
            initialRegion={region}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            showsPointsOfInterest={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            mapType="none"
            showsCompass={true}
            showsScale={true}
            showsUserLocation={false}
            followsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* Mapa con calles visibles usando CartoDB */}
            <UrlTile
              urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
              maximumZ={20}
              flipY={false}
            />

            {/* Marcador del usuario con símbolo de persona - solo si hay permisos y ubicación */}
            {userLocation && locationPermission === 'granted' && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Tu ubicación"
              >
                <View style={styles.userMarker}>
                  <Text style={styles.userMarkerText}>👤</Text>
                </View>
              </Marker>
            )}

            {/* Marcadores de museos con información */}
            {museums.map((museum) => (
              <Marker
                key={museum.id}
                coordinate={{
                  latitude: museum.latitude,
                  longitude: museum.longitude,
                }}
                onPress={() => handleMuseumPress(museum)}
              >
                <Pressable style={styles.museumMarker}>
                  <Text style={styles.museumText}>🏛️</Text>
                </Pressable>
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{museum.name}</Text>
                    <Text style={styles.calloutSubtitle}>{museum.description}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}

            {/* Marcadores de resultados de búsqueda */}
            {searchResults.map((result) => (
              <Marker
                key={`search-${result.id}`}
                coordinate={{
                  latitude: result.latitude,
                  longitude: result.longitude,
                }}
                onPress={() => focusOnSearchResult(result)}
              >
                <Pressable style={styles.searchResultMarker}>
                  <Text style={styles.searchResultText}>
                    {result.type === 'museum' ? '🏛️' : '📍'}
                  </Text>
                </Pressable>
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{result.name}</Text>
                    <Text style={styles.calloutSubtitle}>
                      {result.type === 'museum' ? 'Museo' : 'Lugar de interés'}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Botón de ubicación en la parte inferior */}
          <View style={styles.bottomButtonContainer}>
            <Pressable 
              style={[
                styles.locationButton, 
                locationPermission === 'denied' && styles.locationButtonDisabled
              ]} 
              onPress={focusOnUserLocation}
            >
              <Text style={[
                styles.locationButtonText,
                locationPermission === 'denied' && styles.locationButtonTextDisabled
              ]}>
                {locationPermission === 'denied' ? '🔒' : '📍'}
              </Text>
            </Pressable>
          </View>

          {/* Tarjeta del museo seleccionado */}
          {selectedMuseum && (
            <View style={styles.museumCard}>
              <View style={styles.museumCardHeader}>
                <Text style={styles.museumCardTitle}>{selectedMuseum.name}</Text>
                <Pressable style={styles.closeButton} onPress={handleCloseCard}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.museumCardDescription} numberOfLines={2}>
                {selectedMuseum.description}
              </Text>
              <View style={styles.museumCardButtons}>
                <Pressable style={styles.goToButton} onPress={handleGoToMuseum}>
                  <Ionicons name="navigate" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.infoButton} onPress={() => handleMuseumInfo(selectedMuseum)}>
                  <Ionicons name="information-circle" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.adventureButton} onPress={handleStartAdventure}>
                  <Ionicons name="rocket" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    borderRadius: 15, // Mapa cuadrado con bordes redondeados
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  map: { 
    flex: 1,
    borderRadius: 15, // Mapa cuadrado con bordes redondeados
  },

  museumMarker: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 10, // Radio = width/2 para círculo perfecto
    width: 30, // Ancho fijo
    height: 30, // Alto fijo
    borderWidth: 2,
    borderColor: "#8B4513",
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Importante para mantener la forma circular
  },
  museumText: {
    fontSize: 20,
  },
  searchResultMarker: {
    backgroundColor: "rgba(255, 215, 0, 0.95)", // Dorado para resultados de búsqueda
    borderRadius: 10,
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: "#FFD700",
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchResultText: {
    fontSize: 20,
  },
  userMarker: {
    backgroundColor: "rgba(30, 144, 255, 0.9)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 8,
  },
  userMarkerText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  calloutContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 10,
    padding: 12,
    minWidth: 150,
    elevation: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: [{ translateX: -25 }],
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  locationButton: {
    padding: 8,
  },
  locationButtonText: {
    fontSize: 24,
    color: "#333",
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  locationButtonTextDisabled: {
    color: "#999",
  },
  // Estilos para la tarjeta del museo
  museumCard: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  museumCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  museumCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  museumCardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  museumCardButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  goToButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minHeight: 56,
  },
  goToButtonPressed: {
    backgroundColor: "#388E3C",
    elevation: 3,
    shadowOpacity: 0.2,
  },
  infoButton: {
    flex: 1,
    backgroundColor: "#607D8B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minHeight: 56,
  },
  infoButtonPressed: {
    backgroundColor: "#455A64",
    elevation: 3,
    shadowOpacity: 0.2,
  },
  adventureButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minHeight: 56,
  },
  adventureButtonPressed: {
    backgroundColor: "#1976D2",
    elevation: 3,
    shadowOpacity: 0.2,
  },
});