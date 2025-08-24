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
import MuseumInfoCard, { MuseumLite } from '@components/Map/MuseumInfoCard';

import { getPagedMuseums } from '@services/museum/getListarMuseums';
import type { MuseumResponse } from '@interfaces/museum/MuseumResponse';

type LatLng = { latitude: number; longitude: number };
const DEFAULT_COORD: LatLng = { latitude: -12.0464, longitude: -77.0428 };
const DEFAULT_ZOOM = 13;

const MUSEUM_ICON_REQUIRE = require('../../../assets/museumx100.png');
const CHARACTER_ICON_REQUIRE = require('../../../assets/character.png');

const toLatLng = (c?: { latitude?: number; longitude?: number } | null): LatLng | null =>
  (c && typeof c.latitude === 'number' && typeof c.longitude === 'number')
    ? { latitude: c.latitude, longitude: c.longitude }
    : null;

export default function GMap() {
  const [status, requestPerm] = useLocationPermissions();
  const [isReady, setIsReady] = useState(false);
  const [museos, setMuseos] = useState<MuseumResponse[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<{ name: string; coordinates: LatLng } | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [selectedMuseum, setSelectedMuseum] = useState<MuseumLite | null>(null);

  const museumIconRef = useImage(MUSEUM_ICON_REQUIRE);
  const characterIconRef = useImage(CHARACTER_ICON_REQUIRE);

  const appleRef = useRef<AppleMaps.MapView>(null);
  const googleRef = useRef<GoogleMaps.MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

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

  useEffect(() => {
    if (!status || status.status !== 'granted') {
      requestPerm().catch(() => {});
    }
  }, [status, requestPerm]);

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

  const startWatchingLocation = useCallback(async () => {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') return;
    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 3000 },
      (loc) => {
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        if (followUser) flyTo(coords, 18);
      }
    );
  }, [followUser, flyTo]);

  useEffect(() => {
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === 'granted') await startWatchingLocation();
    })();
    return () => { watchRef.current?.remove(); watchRef.current = null; };
  }, [startWatchingLocation]);

  const updateUserLocation = useCallback(async () => {
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa la ubicación para centrar el mapa en tu posición.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      setFollowUser(true);
      flyTo(coords, 18);
      await startWatchingLocation();
    } catch (err) {
      console.warn('Ubicación', err);
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación.');
    }
  }, [flyTo, startWatchingLocation]);

  // iOS: SIN callout nativo -> no pasamos 'title'
  const baseMarkersApple: AppleMapsMarker[] = useMemo(
    () => museos.map((m) => ({
      id: String(m.id),
      coordinates: { latitude: m.latitude, longitude: m.longitude },
      tintColor: 'purple',
      // ❌ title: m.name  (lo quitamos para evitar el callout por defecto)
      // systemImage opcional si quisieras, pero no influye en callout
      systemImage: 'building.columns',
    })),
    [museos]
  );

  const appleAnnotations = useMemo(() => {
    if (!userLocation) return [];
    return [{ id: '__userChar', title: 'Estás aquí', coordinates: userLocation, icon: characterIconRef ?? undefined }];
  }, [userLocation, characterIconRef]);

  const markersApple: AppleMapsMarker[] = baseMarkersApple;

  // Android: SIN callout nativo -> showCallout: false
  const markersGoogle: GoogleMapsMarker[] = useMemo(() => {
    const base: GoogleMapsMarker[] = museos.map((m) => ({
      id: String(m.id),
      title: m.name,            // no se muestra porque showCallout: false
      snippet: m.description ?? 'Museo',
      coordinates: { latitude: m.latitude, longitude: m.longitude },
      icon: museumIconRef ?? undefined,
      showCallout: false,       // 👈 evita la tarjeta nativa
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
    return base;
  }, [museos, museumIconRef, userLocation, characterIconRef]);

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

  // ===== iOS =====
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <AppleMaps.View
          ref={appleRef}
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          properties={{ mapType: AppleMapsMapType.STANDARD, isTrafficEnabled: false, selectionEnabled: true }}
          uiSettings={{ compassEnabled: true, myLocationButtonEnabled: false, scaleBarEnabled: true, togglePitchEnabled: true }}
          markers={markersApple}
          annotations={appleAnnotations}
          onMapClick={() => { setSelectedPOI(null); setSelectedMuseum(null); }}
          onMarkerClick={(marker: any) => {
            setFollowUser(false);
            const c = toLatLng(marker?.coordinates);
            if (marker?.id === '__userChar') { if (c) flyTo(c, 17); return; }
            const found = museos.find(m => String(m.id) === String(marker?.id));
            if (found) {
              setSelectedMuseum({ id: found.id, name: found.name, latitude: found.latitude, longitude: found.longitude, description: found.description });
            }
            if (c) flyTo(c, 17);
          }}
          onCameraMove={() => {}}
        />

        {/* Tarjeta ARRIBA */}
        <MuseumInfoCard
          placement="top"
          visible={!!selectedMuseum}
          museum={selectedMuseum}
          userLocation={userLocation}
          onClose={() => setSelectedMuseum(null)}
          infoScreenName="MuseumforOneScreen"
          adventureScreenName="Aventura"
          aventureScreenName="AventureSceen"
        />

        {/* Botón ubicación centrado */}
        <Pressable style={styles.locBtnCenter} onPress={updateUserLocation}>
          <MaterialIcons name="location-on" size={28} color="#d32f2f" />
        </Pressable>

        <Controls />

        {!isReady && <View style={styles.loading}><Text style={{ color: '#fff' }}>Cargando mapa…</Text></View>}
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
        onPOIClick={(e: any) => {
          setFollowUser(false);
          const c = toLatLng(e?.coordinates);
          if (c) { setSelectedPOI({ name: e?.name ?? 'Lugar', coordinates: c }); flyTo(c, 17); }
        }}
        onMarkerClick={(marker: any) => {
          setFollowUser(false);
          const c = toLatLng(marker?.coordinates);
          if (marker?.id === '__userChar') { if (c) flyTo(c, 17); return; }
          const found = museos.find(m => String(m.id) === String(marker?.id));
          if (found) {
            setSelectedMuseum({ id: found.id, name: found.name, latitude: found.latitude, longitude: found.longitude, description: found.description });
          }
          if (c) flyTo(c, 17);
        }}
        onMapLoaded={onMapLoaded}
        onMapClick={() => { setSelectedPOI(null); setSelectedMuseum(null); }}
        onMapLongClick={() => {}}
        onCameraMove={() => {}}
      />

      {/* Tarjeta ARRIBA */}
      <MuseumInfoCard
        placement="top"
        visible={!!selectedMuseum}
        museum={selectedMuseum}
        userLocation={userLocation}
        onClose={() => setSelectedMuseum(null)}
        infoScreenName="MuseumforOneScreen"
        adventureScreenName="Aventura"
        aventureScreenName="AventureSceen"
      />

      {/* Chip del POI (si quieres mantenerlo) */}
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

      {!isReady && <View style={styles.loading}><Text style={{ color: '#fff' }}>Cargando mapa…</Text></View>}
    </View>
  );
}

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
    top: 70, // para no chocar con la tarjeta
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
