import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppleMaps, GoogleMaps, useLocationPermissions } from 'expo-maps';
import type { AppleMapsMarker } from 'expo-maps/build/apple/AppleMaps.types';
import type { GoogleMapsMarker } from 'expo-maps/build/google/GoogleMaps.types';
import { AppleMapsMapType } from 'expo-maps/build/apple/AppleMaps.types';
import { GoogleMapsColorScheme, GoogleMapsMapType } from 'expo-maps/build/google/GoogleMaps.types';
import * as Location from 'expo-location';
import { useImage } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

// Services & types del backend
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import type { MuseumResponse } from '@interfaces/museum/MuseumResponse';

// ===== Helpers y constantes =====
type LatLng = { latitude: number; longitude: number };
const DEFAULT_COORD: LatLng = { latitude: -12.0464, longitude: -77.0428 }; // Lima
const DEFAULT_ZOOM = 13;

// Iconos locales
const MUSEUM_ICON_REQUIRE = require('../../../assets/museumx100.png');
const CHARACTER_ICON_REQUIRE = require('../../../assets/character.png');

// Convierte Coordinates (latitude? / longitude?) a LatLng estricto, o null si no es válido
const toLatLng = (
  c?: { latitude?: number; longitude?: number } | null
): LatLng | null => {
  if (c && typeof c.latitude === 'number' && typeof c.longitude === 'number') {
    return { latitude: c.latitude, longitude: c.longitude };
  }
  return null;
};

export default function GMap() {
  const [status, requestPerm] = useLocationPermissions();
  const [isReady, setIsReady] = useState(false);
  const [museos, setMuseos] = useState<MuseumResponse[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<{ name: string; coordinates: LatLng } | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Refs de imagen (SharedRefType<'image'> que espera expo-maps)
  const museumIconRef = useImage(MUSEUM_ICON_REQUIRE);
  const characterIconRef = useImage(CHARACTER_ICON_REQUIRE);

  // Refs de mapas
  const appleRef = useRef<AppleMaps.MapView>(null);
  const googleRef = useRef<GoogleMaps.MapView>(null);

  // Cargar museos desde backend
  useEffect(() => {
    (async () => {
      try {
        const data = await getPagedMuseums(0, 100);
        setMuseos(data.contents ?? []);
      } catch (e) {
        console.warn('Error cargando museos:', e);
        Alert.alert('Museos', 'No se pudieron cargar los museos.');
      }
    })();
  }, []);

  // Pedir permisos (si no están concedidos)
  useEffect(() => {
    if (!status || status.status !== 'granted') {
      requestPerm().catch(() => {});
    }
  }, [status, requestPerm]);

  // Posición inicial (común)
  const cameraPosition = useMemo(
    () => ({
      coordinates: { ...DEFAULT_COORD },
      zoom: DEFAULT_ZOOM,
    }),
    []
  );

  // Marcadores de museos (iOS)
  const baseMarkersApple: AppleMapsMarker[] = useMemo(
    () =>
      museos.map((m) => ({
        id: String(m.id),
        title: m.name,
        coordinates: { latitude: m.latitude, longitude: m.longitude },
        systemImage: 'building.columns', // SF Symbol estilo museo
        tintColor: 'purple',
      })),
    [museos]
  );

  // Marcador del usuario en iOS (con imagen character.png) vía annotations
  const appleAnnotations = useMemo(() => {
    if (!userLocation) return [];
    return [
      {
        id: '__userChar',
        title: 'Estás aquí',
        coordinates: userLocation,
        icon: characterIconRef ?? undefined, // imagen personalizada en iOS
      },
    ];
  }, [userLocation, characterIconRef]);

  // Si además quieres conservar un pin azul nativo en iOS, podrías
  // agregarlo a markersApple, pero aquí usamos solo la imagen personalizada.
  const markersApple: AppleMapsMarker[] = baseMarkersApple;

  // Marcadores de museos + personaje del usuario (Android)
  const markersGoogle: GoogleMapsMarker[] = useMemo(() => {
    const base: GoogleMapsMarker[] = museos.map((m) => ({
      id: String(m.id),
      title: m.name,
      snippet: m.description ?? 'Museo',
      coordinates: { latitude: m.latitude, longitude: m.longitude },
      icon: museumIconRef ?? undefined, // icono de museo
      showCallout: true,
      draggable: false,
    }));

    if (userLocation) {
      base.push({
        id: '__userChar',
        title: 'Estás aquí',
        coordinates: userLocation,
        icon: characterIconRef ?? undefined, // icono character.png
        showCallout: false,
        draggable: false,
      });
    }
    return base;
  }, [museos, museumIconRef, userLocation, characterIconRef]);

  const onMapLoaded = useCallback(() => setIsReady(true), []);

  const flyTo = useCallback((coords: LatLng, zoom = 16) => {
    if (Platform.OS === 'ios') {
      appleRef.current?.setCameraPosition({ coordinates: coords, zoom });
    } else if (Platform.OS === 'android') {
      googleRef.current?.setCameraPosition({ coordinates: coords, zoom, duration: 600 });
    }
  }, []);

  // Obtener/centrar ubicación del usuario (botón flotante)
  const updateUserLocation = useCallback(async () => {
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa la ubicación para centrar el mapa en tu posición.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      flyTo(coords, 18); // zoom más cercano
    } catch (err) {
      console.warn('Error al obtener ubicación', err);
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación.');
    }
  }, [flyTo]);

  // Controles flotantes: 3D (gestos) y POI seleccionado
  const Controls = () => (
    <View style={styles.controls}>
      <Pressable
        style={styles.btn}
        onPress={() => {
          flyTo(DEFAULT_COORD, 17);
          Alert.alert('3D', 'Usa dos dedos para inclinar (tilt) y rota para vista 3D.');
        }}
      >
        <Text style={styles.btnTxt}>3D</Text>
      </Pressable>

      {selectedPOI && (
        <Pressable style={styles.btn} onPress={() => flyTo(selectedPOI.coordinates, 17)}>
          <Text style={styles.btnTxt}>POI</Text>
        </Pressable>
      )}
    </View>
  );

  // ===== iOS (Apple Maps) =====
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <AppleMaps.View
          ref={appleRef}
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          properties={{
            mapType: AppleMapsMapType.STANDARD,
            isTrafficEnabled: false, // sin tráfico
            selectionEnabled: true,
          }}
          uiSettings={{
            compassEnabled: true,
            myLocationButtonEnabled: false,
            scaleBarEnabled: true,
            togglePitchEnabled: true, // tilt (3D) por gestos
          }}
          markers={markersApple}
          // mostramos la imagen del usuario como annotation
          annotations={appleAnnotations}
          onMapClick={() => {
            setSelectedPOI(null);
          }}
          onMarkerClick={(marker: any) => {
            const c = toLatLng(marker?.coordinates);
            if (c) flyTo(c, 17);
          }}
          onCameraMove={() => {}}
        />

        {/* Botón flotante de ubicación (centrado) */}
        <Pressable style={styles.locBtnCenter} onPress={updateUserLocation}>
          {/* Pin clásico estilo gota */}
          <MaterialIcons name="location-on" size={28} color="#d32f2f" />
        </Pressable>

        <Controls />

        {!isReady && (
          <View style={styles.loading}>
            <Text style={{ color: '#fff' }}>Cargando mapa…</Text>
          </View>
        )}
      </View>
    );
  }

  // ===== Android (Google Maps) =====
  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <GoogleMaps.View
          ref={googleRef}
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          colorScheme={GoogleMapsColorScheme.FOLLOW_SYSTEM}
          properties={{
            isTrafficEnabled: false, // sin tráfico
            isIndoorEnabled: true,
            isBuildingEnabled: true, // edificios 3D
            selectionEnabled: true,
            isMyLocationEnabled: status?.status === 'granted', // punto azul nativo
            mapType: GoogleMapsMapType.NORMAL,
          }}
          uiSettings={{
            zoomControlsEnabled: true,
            myLocationButtonEnabled: false, // usamos nuestro botón
            rotationGesturesEnabled: true,
            tiltGesturesEnabled: true, // gestos 3D
            scrollGesturesEnabled: true,
            scrollGesturesEnabledDuringRotateOrZoom: true,
            mapToolbarEnabled: true,
            scaleBarEnabled: true,
            indoorLevelPickerEnabled: true,
            compassEnabled: true,
          }}
          markers={markersGoogle}
          onPOIClick={(e: any) => {
            const c = toLatLng(e?.coordinates);
            if (c) {
              const poi = { name: e?.name ?? 'Lugar', coordinates: c };
              setSelectedPOI(poi);
              flyTo(c, 17);
            }
          }}
          onMarkerClick={(marker: any) => {
            const c = toLatLng(marker?.coordinates);
            if (c) flyTo(c, 17);
          }}
          onMapLoaded={onMapLoaded}
          onMapClick={() => setSelectedPOI(null)}
          onMapLongClick={() => {}}
          onCameraMove={() => {}}
        />

        {/* Chip informativo del POI seleccionado */}
        {selectedPOI && (
          <View style={styles.poiChip}>
            <Text style={styles.poiTxt}>📍 {selectedPOI.name}</Text>
          </View>
        )}

        {/* Botón flotante de ubicación (centrado) */}
        <Pressable style={styles.locBtnCenter} onPress={updateUserLocation}>
          <MaterialIcons name="location-on" size={28} color="#d32f2f" />
        </Pressable>

        <Controls />

        {!isReady && (
          <View style={styles.loading}>
            <Text style={{ color: '#fff' }}>Cargando mapa…</Text>
          </View>
        )}
      </View>
    );
  }

  return <Text>Maps are only available on Android and iOS</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },

  controls: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    gap: 10,
  },
  btn: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnTxt: { color: '#fff', fontWeight: '600' },

  poiChip: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  poiTxt: { color: '#fff', fontWeight: '600' },

  // Botón de ubicación centrado (abajo al medio)
  locBtnCenter: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -24 }], // mitad de width
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  loading: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
