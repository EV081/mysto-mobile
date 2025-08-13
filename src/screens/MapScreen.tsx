import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert, Button, Linking, Platform } from "react-native";
import MapView, { UrlTile, Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { getPagedMuseums } from "@services/museum/getListarMuseums"; // tu función
import type { MuseumResponse } from "@interfaces/museum/MuseumResponse";

export default function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [museums, setMuseums] = useState<MuseumResponse[]>([]);

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
      const data = await getPagedMuseums(0, 50); // por ejemplo, traer hasta 50
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

  return (
    <View style={styles.container}>
      {region && (
        <>
          <MapView style={styles.map} initialRegion={region}>
            <UrlTile
              urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
              maximumZ={20}
              flipY={false}
            />

            {/* Marcador del usuario */}
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              pinColor="blue"
              title={region === defaultRegion ? "Lima" : "Tu ubicación"}
            />

            {/* Marcadores de museos */}
            {museums.map((museum) => (
              <Marker
                key={museum.id}
                coordinate={{
                  latitude: museum.latitude,
                  longitude: museum.longitude,
                }}
                title={museum.name}
                description={museum.description}
              />
            ))}
          </MapView>

          <View style={styles.buttonContainer}>
            <Button title="📍 Mi ubicación" onPress={getUserLocation} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
  },
});
