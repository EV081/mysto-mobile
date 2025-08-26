import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppleMaps, GoogleMaps, useLocationPermissions } from 'expo-maps';
import type { AppleMapsMarker } from 'expo-maps/build/apple/AppleMaps.types';
import type { GoogleMapsMarker } from 'expo-maps/build/google/GoogleMaps.types';
import { AppleMapsMapType, AppleMapsContourStyle } from 'expo-maps/build/apple/AppleMaps.types';
import { GoogleMapsColorScheme, GoogleMapsMapType } from 'expo-maps/build/google/GoogleMaps.types';
import * as Location from 'expo-location';
import { useImage } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

import MuseumInfoCard, { MuseumLite } from '@components/Map/MuseumInfoCard';
import { getDirections } from '@components/Map/getDirections';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import type { MuseumResponse } from '@interfaces/museum/MuseumResponse';

// ===== Helpers y constantes =====
export type LatLng = { latitude: number; longitude: number };

type ExternalPlace = {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
};

type Props = {
  /** Coordenada a la que debe volar el mapa cuando cambie la búsqueda */
  focusCoord?: LatLng | null;
  /** Zoom al centrar con búsqueda (por defecto 17) */
  focusZoom?: number;
  /** Lugares externos (POIs reales) a pintar como pines */
  externalPlaces?: ExternalPlace[];
  /** NUEVO: separación superior para la tarjeta (debajo de la search bar) */
  cardTopInset?: number;
};

// Coordenada base (Lima)
const DEFAULT_COORD: LatLng = { latitude: -12.0464, longitude: -77.0428 };
const DEFAULT_ZOOM = 13;

// Iconos locales
const MUSEUM_ICON_REQUIRE = require('../../../assets/museumx100.png');
const CHARACTER_ICON_REQUIRE = require('../../../assets/character.png');

// Convierte Coordinates a LatLng estricto
const toLatLng = (c?: { latitude?: number; longitude?: number } | null): LatLng | null =>
  (c && typeof c.latitude === 'number' && typeof c.longitude === 'number')
    ? { latitude: c.latitude, longitude: c.longitude }
    : null;

// --- Encuadra la cámara a una lista de coordenadas ---
function fitCameraToCoords(
  coords: LatLng[],
  flyTo: (c: LatLng, zoom?: number) => void
) {
  if (!coords?.length) return;

  let minLat = coords[0].latitude, maxLat = coords[0].latitude;
  let minLng = coords[0].longitude, maxLng = coords[0].longitude;

  for (const c of coords) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }

  const center = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  };

  const latDelta = Math.max(0.000001, maxLat - minLat);
  const lngDelta = Math.max(0.000001, maxLng - minLng);
  const span = Math.max(latDelta, lngDelta);

  const zoom =
    span < 0.003 ? 18 :
    span < 0.006 ? 17 :
    span < 0.012 ? 16 :
    span < 0.025 ? 15 :
    span < 0.05  ? 14 :
    span < 0.1   ? 13 :
    span < 0.2   ? 12 :
    span < 0.5   ? 11 : 10;

  flyTo(center, zoom);
}

export default function GMap({
  focusCoord = null,
  focusZoom = 17,
  externalPlaces = [],
  cardTopInset = 12, // <-- NUEVO default
}: Props) {
  const [status, requestPerm] = useLocationPermissions();
  const [isReady, setIsReady] = useState(false);
  const [museos, setMuseos] = useState<MuseumResponse[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<{ name: string; coordinates: LatLng } | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumLite | null>(null);

  // Dirección en mapa
  const [dirActive, setDirActive] = useState(false);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirCoords, setDirCoords] = useState<LatLng[]>([]);

  // Refs de imagen para expo-maps
  const museumIconRef = useImage(MUSEUM_ICON_REQUIRE);
  const characterIconRef = useImage(CHARACTER_ICON_REQUIRE);

  // Refs de mapas
  const appleRef = useRef<AppleMaps.MapView>(null);
  const googleRef = useRef<GoogleMaps.MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

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

  // Posición/cámara inicial
  const cameraPosition = useMemo(
    () => ({ coordinates: { ...DEFAULT_COORD }, zoom: DEFAULT_ZOOM }),
    []
  );

  const onMapLoaded = useCallback(() => setIsReady(true), []);

  const flyTo = useCallback((coords: LatLng, zoom = 16) => {
    if (Platform.OS === 'ios') {
      appleRef.current?.setCameraPosition({ coordinates: coords, zoom });
    } else {
      googleRef.current?.setCameraPosition({ coordinates: coords, zoom, duration: 600 });
    }
  }, []);

  // 👉 Reaccionar a focusCoord para centrar el mapa desde HomeScreen
  useEffect(() => {
    if (focusCoord) {
      setFollowUser(false);
      setSelectedPOI(null);
      setSelectedMuseum(null);
      flyTo(focusCoord, focusZoom ?? 17);
    }
  }, [focusCoord, focusZoom, flyTo]);

  // Seguimiento de ubicación
  const startWatchingLocation = useCallback(async () => {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') return;

    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 3000 },
      (loc) => {
        const coords: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        if (followUser) {
          flyTo(coords, 18);
        }
      }
    );
  }, [followUser, flyTo]);

  useEffect(() => {
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === 'granted') await startWatchingLocation();
    })();

    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [startWatchingLocation]);

  // Centrar manual en usuario
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
      setFollowUser(true);
      flyTo(coords, 18);
      await startWatchingLocation();
    } catch (err) {
      console.warn('Error al obtener ubicación', err);
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación.');
    }
  }, [flyTo, startWatchingLocation]);

  // Marcadores de museos (iOS) sin callout nativo
  const baseMarkersApple: AppleMapsMarker[] = useMemo(
    () =>
      museos.map((m) => ({
        id: String(m.id),
        coordinates: { latitude: m.latitude, longitude: m.longitude },
        tintColor: 'purple',
        systemImage: 'building.columns',
      })),
    [museos]
  );

  // Marcadores externos (iOS)
  const extMarkersApple: AppleMapsMarker[] = useMemo(
    () =>
      (externalPlaces || []).map((p) => ({
        id: `ext-${p.id}`,
        coordinates: { latitude: p.latitude, longitude: p.longitude },
        tintColor: 'orange',
        systemImage: 'mappin.and.ellipse', // pin clásico
      })),
    [externalPlaces]
  );

  // Marker del usuario en iOS como annotation con icono propio
  const appleAnnotations = useMemo(() => {
    if (!userLocation) return [];
    return [
      {
        id: '__userChar',
        title: 'Estás aquí',
        coordinates: userLocation,
        icon: characterIconRef ?? undefined,
      },
    ];
  }, [userLocation, characterIconRef]);

  // Combinar marcadores en iOS
  const markersApple: AppleMapsMarker[] = useMemo(
    () => [...baseMarkersApple, ...extMarkersApple],
    [baseMarkersApple, extMarkersApple]
  );

  // Marcadores de museos + usuario + externos (Android) sin callout nativo
  const markersGoogle: GoogleMapsMarker[] = useMemo(() => {
    const base: GoogleMapsMarker[] = museos.map((m) => ({
      id: String(m.id),
      title: m.name,
      snippet: m.description ?? 'Museo',
      coordinates: { latitude: m.latitude, longitude: m.longitude },
      icon: museumIconRef ?? undefined,
      showCallout: false,
      draggable: false,
    }));

    if (userLocation) {
      base.push({
        id: '__userChar',
        title: 'Estás aquí',
        coordinates: userLocation,
        icon: characterIconRef ?? undefined,
        showCallout: false,
        draggable: false,
      });
    }

    (externalPlaces || []).forEach((p) => {
      base.push({
        id: `ext-${p.id}`,
        title: p.name,
        coordinates: { latitude: p.latitude, longitude: p.longitude },
        showCallout: false,
        draggable: false,
        // icon: require('../../../assets/pin-gold.png') // si quisieras un asset propio
      });
    });

    return base;
  }, [museos, museumIconRef, userLocation, characterIconRef, externalPlaces]);

  // Pedir y mostrar direcciones reales
  const fetchDirections = useCallback(async () => {
    if (!selectedMuseum || !userLocation) return;
    setDirLoading(true);
    try {
      const res = await getDirections(
        userLocation,
        { latitude: selectedMuseum.latitude, longitude: selectedMuseum.longitude },
        { mode: 'walking' }
      );

      const coords = res.coords ?? [];
      setDirCoords(coords);
      setDirActive(true);

      if (coords.length) fitCameraToCoords(coords, flyTo);
    } catch (e: any) {
      console.warn('Directions error', e?.message || e);
      Alert.alert('Rutas', 'No se pudo obtener la ruta. Intenta de nuevo.');
    } finally {
      setDirLoading(false);
    }
  }, [selectedMuseum, userLocation, flyTo]);

  const toggleDirections = useCallback(() => {
    if (!userLocation || !selectedMuseum) return;
    if (dirActive) {
      setDirActive(false);
      setDirCoords([]);
    } else {
      fetchDirections();
    }
  }, [dirActive, fetchDirections, selectedMuseum, userLocation]);

  // Si cambias de museo mientras la ruta está activa, re-calcula
  useEffect(() => {
    if (dirActive && selectedMuseum && userLocation) {
      fetchDirections();
    }
  }, [dirActive, selectedMuseum?.id, userLocation, fetchDirections]);

  const Controls = () => (
    <View style={styles.controlsLeft}>
      <Pressable
        style={styles.btn}
        onPress={() => {
          setFollowUser(false);
          Alert.alert('3D', 'Usa dos dedos para inclinar (tilt) y rota para vista 3D.');
        }}
      >
        <Text style={styles.btnTxt}>3D</Text>
      </Pressable>

      {selectedPOI && (
        <Pressable
          style={styles.btn}
          onPress={() => {
            setFollowUser(false);
            flyTo(selectedPOI.coordinates, 17);
          }}
        >
          <Text style={styles.btnTxt}>POI</Text>
        </Pressable>
      )}
    </View>
  );

  const clearSelection = useCallback(() => {
    setSelectedPOI(null);
    setSelectedMuseum(null);
  }, []);

  // ===== iOS =====
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <AppleMaps.View
          ref={appleRef}
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          properties={{
            mapType: AppleMapsMapType.STANDARD,
            isTrafficEnabled: false,
            selectionEnabled: true,
            polylineTapThreshold: 40,
          }}
          uiSettings={{
            compassEnabled: true,
            myLocationButtonEnabled: false,
            scaleBarEnabled: true,
            togglePitchEnabled: true,
          }}
          markers={markersApple}
          annotations={appleAnnotations}
          polylines={
            dirActive && dirCoords.length
              ? [{
                  id: 'route',
                  color: 'dodgerblue',
                  width: 8,
                  coordinates: dirCoords,
                  contourStyle: AppleMapsContourStyle.GEODESIC,
                }]
              : []
          }
          onMapClick={clearSelection}
          onMarkerClick={(marker: any) => {
            setFollowUser(false);
            const c = toLatLng(marker?.coordinates);
            if (!c) return;

            // Usuario
            if (marker?.id === '__userChar') { flyTo(c, 17); return; }

            // Lugar externo
            if (String(marker?.id).startsWith('ext-')) {
              setSelectedMuseum(null);
              flyTo(c, 17);
              return;
            }

            // Museo
            const found = museos.find(m => String(m.id) === String(marker?.id));
            if (found) {
              setSelectedMuseum({
                id: found.id,
                name: found.name,
                latitude: found.latitude,
                longitude: found.longitude,
                description: found.description,
              });
            }
            flyTo(c, 17);
          }}
          onPolylineClick={() => {
            if (dirCoords.length) fitCameraToCoords(dirCoords, flyTo);
          }}
          onCameraMove={() => {}}
        />

        <MuseumInfoCard
          placement="top"
          topInset={cardTopInset}   // <-- NUEVO: empuja la tarjeta bajo la search bar
          visible={!!selectedMuseum}
          museum={selectedMuseum}
          userLocation={userLocation}
          onClose={() => setSelectedMuseum(null)}
          infoScreenName="MuseumforOneScreen"
          adventureScreenName="Aventura"
          routeActive={dirActive}
          routeDisabled={!userLocation}
          onToggleRoute={toggleDirections}
        />

        {/* Botón ubicación centrado */}
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

  // ===== Android =====
  return (
    <View style={styles.container}>
      <GoogleMaps.View
        ref={googleRef}
        style={StyleSheet.absoluteFill}
        cameraPosition={cameraPosition}
        colorScheme={GoogleMapsColorScheme.FOLLOW_SYSTEM}
        properties={{
          isTrafficEnabled: false,
          isIndoorEnabled: true,
          isBuildingEnabled: true,
          selectionEnabled: true,
          isMyLocationEnabled: status?.status === 'granted' && !userLocation,
          mapType: GoogleMapsMapType.NORMAL,
        }}
        uiSettings={{
          zoomControlsEnabled: true,
          myLocationButtonEnabled: false,
          rotationGesturesEnabled: true,
          tiltGesturesEnabled: true,
          scrollGesturesEnabled: true,
          scrollGesturesEnabledDuringRotateOrZoom: true,
          mapToolbarEnabled: true,
          scaleBarEnabled: true,
          indoorLevelPickerEnabled: true,
          compassEnabled: true,
        }}
        markers={markersGoogle}
        polylines={
          dirActive && dirCoords.length
            ? [{
                id: 'route',
                color: 'dodgerblue',
                width: 8,
                coordinates: dirCoords,
                geodesic: true,
              }]
            : []
        }
        onPOIClick={(e: any) => {
          setFollowUser(false);
          const c = toLatLng(e?.coordinates);
          if (c) {
            const poi = { name: e?.name ?? 'Lugar', coordinates: c };
            setSelectedPOI(poi);
            flyTo(c, 17);
          }
        }}
        onMarkerClick={(marker: any) => {
          setFollowUser(false);
          const c = toLatLng(marker?.coordinates);
          if (!c) return;

          // Usuario
          if (marker?.id === '__userChar') { flyTo(c, 17); return; }

          // Lugar externo
          if (String(marker?.id).startsWith('ext-')) {
            setSelectedMuseum(null);
            flyTo(c, 17);
            return;
          }

          // Museo
          const found = museos.find(m => String(m.id) === String(marker?.id));
          if (found) {
            setSelectedMuseum({
              id: found.id,
              name: found.name,
              latitude: found.latitude,
              longitude: found.longitude,
              description: found.description,
            });
          }
          flyTo(c, 17);
        }}
        onPolylineClick={() => {
          if (dirCoords.length) fitCameraToCoords(dirCoords, flyTo);
        }}
        onMapLoaded={onMapLoaded}
        onMapClick={clearSelection}
        onMapLongClick={() => {}}
        onCameraMove={() => {}}
      />

      <MuseumInfoCard
        placement="top"
        topInset={cardTopInset}   // <-- NUEVO: empuja la tarjeta bajo la search bar
        visible={!!selectedMuseum}
        museum={selectedMuseum}
        userLocation={userLocation}
        onClose={() => setSelectedMuseum(null)}
        infoScreenName="MuseumforOneScreen"
        adventureScreenName="Aventura"
        routeActive={dirActive}
        routeDisabled={!userLocation}
        onToggleRoute={toggleDirections}
      />

      {/* Chip informativo de POI (opcional) */}
      {selectedPOI && (
        <View style={styles.poiChip}>
          <Text style={styles.poiTxt}>📍 {selectedPOI.name}</Text>
        </View>
      )}

      {/* Botón ubicación centrado */}
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

// ===== Estilos =====
const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },

  controlsLeft: {
    position: 'absolute',
    left: 12,
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
    top: 70,
    left: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  poiTxt: { color: '#fff', fontWeight: '600' },

  locBtnCenter: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -24 }],
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
