import React, { useEffect, useState, useCallback } from "react";
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

export default function MapaBase() {
  const [region, setRegion] = useState<Region | null>(null);
  const [museums, setMuseums] = useState<MuseumResponse[]>([]);
  const navigation = useNavigation();
  const defaultRegion: Region = {
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Solicitar ubicación
  const getUserLocation = async () => {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      if (!canAskAgain) {
        Alert.alert(
          "Permiso denegado permanentemente",
          "Debes habilitar la ubicación manualmente en Configuración.",
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
        Alert.alert("Permiso denegado", "Se usará Lima como ubicación por defecto.");
      }
      setRegion(defaultRegion);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

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
    getUserLocation();
    fetchMuseums();
  }, []);

  // Navegación al tocar un museo
  const handleMuseumPress = useCallback(
    (museum: MuseumResponse) => {
      (navigation as any).navigate("Aventura", { museumId: museum.id });
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      {region && (
        <>
          <MapView 
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

            {/* Marcador del usuario con símbolo de persona */}
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              title={region === defaultRegion ? "Lima" : "Tu ubicación"}
            >
              <View style={styles.userMarker}>
                <Text style={styles.userMarkerText}>👤</Text>
              </View>
            </Marker>

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
          </MapView>

          {/* Botón de ubicación en la parte inferior */}
          <View style={styles.bottomButtonContainer}>
            <Pressable style={styles.locationButton} onPress={getUserLocation}>
              <Text style={styles.locationButtonText}>📍</Text>
            </Pressable>
          </View>
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
});