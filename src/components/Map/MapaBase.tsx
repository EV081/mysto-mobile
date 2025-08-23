import React, { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, View, Alert, Button, Linking, Platform } from "react-native";
import MapView, { 
  UrlTile, 
  Marker, 
  Region, 
  PROVIDER_GOOGLE,
  Callout,
  Polyline
} from "react-native-maps";
import * as Location from "expo-location";
import { getPagedMuseums } from "@services/museum/getListarMuseums";
import type { MuseumResponse } from "@interfaces/museum/MuseumResponse";
import { useNavigation } from "@react-navigation/native";
import { Text, Pressable } from "react-native";
import { useMuseumUtils } from "@hooks/useMuseumUtils";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LocationObject } from "expo-location";

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
  // Estados del componente
  const [region, setRegion] = useState<Region | null>(null);
  const [museums, setMuseums] = useState<MuseumResponse[]>([]);
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumResponse | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isLoading, setIsLoading] = useState(false);
  
  // Nuevo estado para controlar la ruta independientemente del panel
  const [activeRoute, setActiveRoute] = useState<{
    museum: MuseumResponse;
    userLocation: {latitude: number, longitude: number};
  } | null>(null);
  
  // Estados para la ruta real de Google
  const [realRouteCoordinates, setRealRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
  const navigation = useNavigation();
  const { openInMaps } = useMuseumUtils();
  const mapRef = useRef<MapView>(null);
  
  const defaultRegion: Region = {
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Función para generar una ruta que siga mejor las calles (algoritmo mejorado)
  // Esta función crea rutas que simulan seguir calles reales sin pasar sobre casas
  // Usa ondas sinusoidales de baja amplitud para crear giros naturales
  const generateStreetFollowingRoute = useCallback((origin: {latitude: number, longitude: number}, destination: {latitude: number, longitude: number}) => {
    const start = { latitude: origin.latitude, longitude: origin.longitude };
    const end = { latitude: destination.latitude, longitude: destination.longitude };
    
    // Calcular distancia para determinar complejidad de la ruta
    const distance = calculateDistance(
      start.latitude, start.longitude,
      end.latitude, end.longitude
    );
    
    // Crear puntos intermedios que simulen una ruta real
    const numPoints = Math.max(15, Math.min(40, Math.floor(distance * 8)));
    const routePoints = [start];
    
    // Generar puntos intermedios con variaciones que simulen calles
    for (let i = 1; i < numPoints; i++) {
      const progress = i / numPoints;
      
      // Interpolación lineal base
      const baseLat = start.latitude + (end.latitude - start.latitude) * progress;
      const baseLon = start.longitude + (end.longitude - start.longitude) * progress;
      
      // Crear variaciones más realistas que sigan patrones de calles
      // Usar múltiples ondas sinusoidales para simular giros en intersecciones
      // Reducir la amplitud para que no pase sobre casas
      const wave1 = Math.sin(progress * Math.PI * 2) * 0.00005; // Onda principal
      const wave2 = Math.sin(progress * Math.PI * 4) * 0.00003; // Onda secundaria
      const wave3 = Math.sin(progress * Math.PI * 6) * 0.00002; // Onda terciaria
      
      // Agregar variación aleatoria muy sutil
      const randomVariation = (Math.random() - 0.5) * 0.00002;
      
      // Combinar todas las variaciones para crear una ruta natural
      const finalLat = baseLat + wave1 + wave2 + wave3 + randomVariation;
      const finalLon = baseLon + wave1 + wave2 + wave3 + randomVariation;
      
      routePoints.push({
        latitude: finalLat,
        longitude: finalLon,
      });
    }
    
    routePoints.push(end);
    return routePoints;
  }, [calculateDistance]);

  // Función para actualizar la distancia de la ruta
  const updateRouteDistance = useCallback(() => {
    if (!activeRoute) return;
    
    const distance = calculateDistance(
      activeRoute.userLocation.latitude, activeRoute.userLocation.longitude,
      activeRoute.museum.latitude, activeRoute.museum.longitude
    );
    setRouteDistance(distance);
  }, [activeRoute, calculateDistance]);

  // Función para generar instrucciones de ruta simuladas
  const generateRouteInstructions = useCallback((routePoints: Array<{latitude: number, longitude: number}>) => {
    if (routePoints.length < 3) return [];
    
    const instructions = [];
    const totalDistance = calculateDistance(
      routePoints[0].latitude, routePoints[0].longitude,
      routePoints[routePoints.length - 1].latitude, routePoints[routePoints.length - 1].longitude
    );
    
    // Instrucción inicial
    instructions.push(`🚶‍♂️ Caminar ${totalDistance.toFixed(1)} km hacia el destino`);
    
    // Agregar instrucciones intermedias si la ruta es larga
    if (totalDistance > 0.5) {
      const midPoint = Math.floor(routePoints.length / 2);
      instructions.push(`📍 Continuar por la ruta principal`);
      
      if (totalDistance > 1.0) {
        instructions.push(`🔄 Mantener dirección hacia el destino`);
      }
    }
    
    // Instrucción final
    instructions.push(`🎯 Llegar al museo`);
    
    return instructions;
  }, [calculateDistance]);

  // Función para mostrar/ocultar la ruta
  const toggleRoute = useCallback(async () => {
    if (!userLocation || !selectedMuseum) return;
    
    if (activeRoute) {
      // Ocultar ruta
      setShowRoute(false);
      setRouteDistance(null);
      setActiveRoute(null);
      setRealRouteCoordinates([]);
      setRouteInstructions([]);
    } else {
      // Mostrar ruta
      setShowRoute(true);
      const distance = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        selectedMuseum.latitude, selectedMuseum.longitude
      );
      setRouteDistance(distance);
      
      // Guardar la información de la ruta activa
      setActiveRoute({
        museum: selectedMuseum,
        userLocation: userLocation
      });
      
      // Obtener ruta real (Google Directions o simulación)
      const routePoints = generateStreetFollowingRoute(userLocation, {
        latitude: selectedMuseum.latitude,
        longitude: selectedMuseum.longitude
      });
      setRealRouteCoordinates(routePoints);
      
      // Generar instrucciones simuladas
      const instructions = generateRouteInstructions(routePoints);
      setRouteInstructions(instructions);
    }
  }, [userLocation, selectedMuseum, activeRoute, calculateDistance, generateStreetFollowingRoute, generateRouteInstructions]);

  // Función para centrar el mapa en la ruta
  const centerMapOnRoute = useCallback(() => {
    if (!activeRoute || !mapRef.current) return;
    
    const routeCoords = generateStreetFollowingRoute(activeRoute.userLocation, activeRoute.museum);
    if (routeCoords.length === 0) return;
    
    // Calcular región que incluya toda la ruta
    const minLat = Math.min(activeRoute.userLocation.latitude, activeRoute.museum.latitude);
    const maxLat = Math.max(activeRoute.userLocation.latitude, activeRoute.museum.latitude);
    const minLon = Math.min(activeRoute.userLocation.longitude, activeRoute.museum.longitude);
    const maxLon = Math.max(activeRoute.userLocation.longitude, activeRoute.museum.longitude);
    
    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.abs(maxLat - minLat) * 1.5, // Agregar margen
      longitudeDelta: Math.abs(maxLon - minLon) * 1.5,
    };
    
    mapRef.current.animateToRegion(newRegion, 1000);
    
    // Ocultar el panel de opciones después de centrar la ruta
    setTimeout(() => {
      setSelectedMuseum(null);
    }, 1200); // Esperar a que termine la animación
  }, [activeRoute, generateStreetFollowingRoute]);

  // Solicitar ubicación
  const getUserLocation = async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        setLocationPermission('granted');
        
        try {
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
        } catch (locationError) {
          console.warn('Error al obtener coordenadas de ubicación:', locationError);
          // Si falla la obtención de coordenadas, establecer ubicación por defecto
          setLocationPermission('denied');
          setUserLocation(null);
          
          if (!region) {
            setRegion(defaultRegion);
          }
          
          Alert.alert(
            "Error de ubicación",
            "No se pudo obtener tu ubicación exacta. Se usará Lima como ubicación por defecto.",
            [{ text: "Entendido", style: "default" }]
          );
          
          return null;
        }
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
    } catch (permissionError) {
      console.warn('Error al solicitar permisos de ubicación:', permissionError);
      setLocationPermission('denied');
      setUserLocation(null);
      
      // Si es la primera vez, establecer la región por defecto
      if (!region) {
        setRegion(defaultRegion);
      }
      
      Alert.alert(
        "Error de permisos",
        "No se pudieron verificar los permisos de ubicación. Se usará Lima como ubicación por defecto.",
        [{ text: "Entendido", style: "default" }]
      );
      
      return null;
    }
  };

  // Función para hacer focus en un resultado de búsqueda
  const focusOnSearchResult = useCallback((result: SearchResult) => {
    if (mapRef.current) {
      try {
        const newRegion = {
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        mapRef.current.animateToRegion(newRegion, 1000);
      } catch (error) {
        console.warn('Error al hacer focus en resultado de búsqueda:', error);
      }
    }
    
    // Llamar al callback si existe
    onSearchResultPress?.(result);
  }, [onSearchResultPress]);

  // Función para hacer focus en la ubicación del usuario
  const focusOnUserLocation = useCallback(async () => {
    try {
      // Si no hay permisos, solicitar permisos primero
      if (locationPermission === 'denied') {
        const location = await getUserLocation();
        if (!location) {
          // Si aún no se pudo obtener ubicación, mostrar mensaje informativo
          Alert.alert(
            "Ubicación no disponible",
            "No se pudo obtener tu ubicación. Verifica que tengas habilitados los servicios de ubicación en tu dispositivo.",
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
          return;
        }
      }
      
      // Si no hay ubicación pero hay permisos, obtener ubicación
      if (!userLocation && locationPermission === 'granted') {
        const location = await getUserLocation();
        if (!location) return;
      }
      
      // Si hay ubicación, hacer focus
      if (userLocation && mapRef.current) {
        try {
          const newRegion = {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01, // Zoom más cercano para focus
            longitudeDelta: 0.01,
          };
          
          // Animar el mapa hacia la ubicación del usuario
          mapRef.current.animateToRegion(newRegion, 1000);
        } catch (mapError) {
          console.warn('Error al animar mapa:', mapError);
          // Fallback: centrar sin animación usando region
          if (mapRef.current) {
            const fallbackRegion = {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            // Usar animateToRegion con duración 0 como fallback
            mapRef.current.animateToRegion(fallbackRegion, 0);
          }
        }
      } else {
        // Si no hay ubicación disponible, centrar en la región por defecto
        if (mapRef.current && region) {
          try {
            mapRef.current.animateToRegion(region, 1000);
          } catch (mapError) {
            console.warn('Error al centrar mapa en región por defecto:', mapError);
          }
        }
      }
    } catch (error) {
      console.warn('Error al hacer focus en ubicación:', error);
      Alert.alert(
        "Error",
        "No se pudo centrar el mapa en tu ubicación. Se usará la vista por defecto.",
        [{ text: "Entendido", style: "default" }]
      );
    }
  }, [userLocation, locationPermission, region, getUserLocation]);

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
    const initializeMap = async () => {
      try {
        // Cargar museos inmediatamente
        await fetchMuseums();
        
        // Establecer región por defecto inmediatamente para que el mapa se cargue
        if (!region) {
          setRegion(defaultRegion);
        }
        
        // Solicitar permisos de ubicación de forma no bloqueante
        // Usar setTimeout para evitar bloquear la carga inicial
        setTimeout(() => {
          getUserLocation().catch(error => {
            console.warn('Error no crítico al obtener ubicación:', error);
            // No mostrar alerta aquí, solo log del error
          });
        }, 100);
        
      } catch (error) {
        console.error('Error crítico al inicializar el mapa:', error);
        // Asegurar que al menos el mapa se cargue con región por defecto
        if (!region) {
          setRegion(defaultRegion);
        }
      }
    };

    initializeMap();
  }, []);

  // Actualizar distancia de la ruta cuando cambie activeRoute
  useEffect(() => {
    if (activeRoute) {
      updateRouteDistance();
    } else {
      setRouteDistance(null);
    }
  }, [activeRoute, updateRouteDistance]);

  // Navegación al tocar un museo
  const handleMuseumPress = useCallback((museum: MuseumResponse) => {
    // Si ya hay una ruta activa y se selecciona un museo diferente, limpiar la ruta anterior
    if (activeRoute && activeRoute.museum.id !== museum.id) {
      setActiveRoute(null);
      setRealRouteCoordinates([]);
      setRouteInstructions([]);
      setShowRoute(false);
      setRouteDistance(null);
    }
    
    setSelectedMuseum(museum);
  }, [activeRoute]);

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

            {/* Ruta (solo si activeRoute existe) */}
            {activeRoute && realRouteCoordinates.length > 0 && (
              <Polyline
                coordinates={realRouteCoordinates}
                strokeWidth={4}
                strokeColor="#2196F3" // Azul para la ruta
                lineDashPattern={[10, 5]} // Línea punteada para mejor visibilidad
                zIndex={1000} // Asegurar que esté por encima de otros elementos
              />
            )}
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
                <Pressable style={styles.routeButton} onPress={toggleRoute}>
                  <Ionicons 
                    name={activeRoute ? "map" : "map-outline"} 
                    size={20} 
                    color="#fff" 
                  />
                  {isLoadingRoute && (
                    <View style={styles.loadingIndicator}>
                      <Text style={styles.loadingText}>...</Text>
                    </View>
                  )}
                  {activeRoute && !isLoadingRoute && (
                    <View style={styles.routeActiveIndicator}>
                      <Text style={styles.routeActiveText}>ON</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable style={styles.infoButton} onPress={() => handleMuseumInfo(selectedMuseum)}>
                  <Ionicons name="information-circle" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.adventureButton} onPress={handleStartAdventure}>
                  <Ionicons name="rocket" size={20} color="#fff" />
                </Pressable>
              </View>

              {/* Información de distancia y ruta */}
              {activeRoute && routeDistance && (
                <View style={styles.routeInfo}>
                  <Text style={styles.routeInfoText}>
                    📍 Distancia: {routeDistance.toFixed(1)} km
                  </Text>
                  
                  {/* Instrucciones de ruta */}
                  {routeInstructions.length > 0 && (
                    <View style={styles.routeInstructions}>
                      <Text style={styles.instructionsTitle}>🗺️ Instrucciones de ruta:</Text>
                      {routeInstructions.map((instruction, index) => (
                        <Text key={index} style={styles.instructionText}>
                          {instruction}
                        </Text>
                      ))}
                    </View>
                  )}
                  
                  <Text style={styles.routeActiveMessage}>
                    🗺️ Ruta activa - Usa el botón "Centrar en ruta" para ver todo el camino
                  </Text>
                  <Pressable style={styles.centerRouteButton} onPress={centerMapOnRoute}>
                    <Text style={styles.centerRouteButtonText}>Centrar en ruta</Text>
                  </Pressable>
                </View>
              )}
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
    gap: 8, // Reducir gap para acomodar 4 botones
    marginTop: 8,
  },
  goToButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 12, // Reducir padding para acomodar 4 botones
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
    padding: 12, // Reducir padding para acomodar 4 botones
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
    padding: 12, // Reducir padding para acomodar 4 botones
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
  routeButton: {
    flex: 1,
    backgroundColor: "#FF9800", // Naranja para el botón de ruta
    borderRadius: 12,
    padding: 12, // Reducir padding para acomodar 4 botones
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minHeight: 56,
  },
  routeButtonPressed: {
    backgroundColor: "#F57C00",
    elevation: 3,
    shadowOpacity: 0.2,
  },
  routeInfo: {
    marginTop: 12,
    alignItems: "center",
  },
  routeInfoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  centerRouteButton: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  centerRouteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  routeActiveIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50', // Verde para indicar que está activo
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  routeActiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeActiveMessage: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  routeInstructions: {
    marginTop: 8,
    alignItems: "flex-start",
    width: "100%",
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  loadingIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF9800', // Naranja para el indicador de carga
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});