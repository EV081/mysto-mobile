import React, { memo, useCallback, useMemo } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export type LatLng = { latitude: number; longitude: number };

export type MuseumLite = {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
};

type Props = {
  visible: boolean;
  museum: MuseumLite | null | undefined;
  userLocation?: LatLng | null;
  onClose?: () => void;

  /** Nombres de pantallas para navegación */
  infoScreenName?: string;       // default: 'MuseumforOneScreen'
  adventureScreenName?: string;  // default: 'Aventura'

  /** Ubicación de la tarjeta: 'top' | 'bottom' */
  placement?: 'top' | 'bottom';

  /** Ruta en el mapa (toggle) */
  routeActive?: boolean;
  routeDisabled?: boolean; // cuando no hay userLocation
  onToggleRoute?: () => void;

  /** NUEVO: separación desde los bordes */
  topInset?: number;
  bottomInset?: number;
};

const openExternalDirections = async (dest: LatLng, origin?: LatLng | null) => {
  try {
    const base = 'https://www.google.com/maps/dir/?api=1';
    const destination = `destination=${dest.latitude},${dest.longitude}`;
    const originPart = origin ? `&origin=${origin.latitude},${origin.longitude}` : '';
    const url = `${base}&${destination}${originPart}&travelmode=walking`;

    if (Platform.OS === 'ios') {
      const appleUrl = `maps://?daddr=${dest.latitude},${dest.longitude}${origin ? `&saddr=${origin.latitude},${origin.longitude}` : ''}&dirflg=w`;
      const can = await Linking.canOpenURL('maps://');
      if (can) return Linking.openURL(appleUrl);
    }
    await Linking.openURL(url);
  } catch {}
};

function MuseumInfoCard({
  visible,
  museum,
  userLocation,
  onClose,
  infoScreenName = 'MuseumforOneScreen',
  adventureScreenName = 'Aventura',
  placement = 'bottom',
  routeActive = false,
  routeDisabled = false,
  onToggleRoute,
  topInset,
  bottomInset,
}: Props) {
  const navigation = useNavigation<any>();

  const containerStyle = useMemo(() => {
    return [
      styles.wrap,
      placement === 'top'
        ? { top: topInset ?? 12, bottom: undefined }
        : { bottom: bottomInset ?? 12, top: undefined },
    ];
  }, [placement, topInset, bottomInset]);

  const goInfo = useCallback(() => {
    if (!museum) return;
    navigation.navigate(infoScreenName, { museumId: museum.id });
  }, [navigation, museum, infoScreenName]);

  const goAdventure = useCallback(() => {
    if (!museum) return;
    navigation.navigate(adventureScreenName, {
      museumId: museum.id,
      museumName: museum.name,
      museumLocation: {
        latitude: museum.latitude,
        longitude: museum.longitude,
        name: museum.name,
      },
      userLocation: userLocation ?? null,
      hasUserLocation: !!userLocation,
    });
  }, [navigation, museum, adventureScreenName, userLocation]);

  const goDirections = useCallback(() => {
    if (!museum) return;
    openExternalDirections(
      { latitude: museum.latitude, longitude: museum.longitude },
      userLocation ?? undefined
    );
  }, [museum, userLocation]);

  if (!visible || !museum) return null;

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <View style={styles.card} pointerEvents="auto">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {museum.name}
          </Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Botones SOLO con íconos */}
        <View style={styles.actions}>
          {/* RUTA EN EL MAPA (toggle) */}
          <Pressable
            style={[styles.iconBtn, routeDisabled && { opacity: 0.4 }]}
            onPress={routeDisabled ? undefined : onToggleRoute}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
          >
            <MaterialCommunityIcons
              name="routes"
              size={22}
              color={routeActive ? '#4caf50' : '#fff'}
            />
          </Pressable>

          {/* Info */}
          <Pressable
            style={styles.iconBtn}
            onPress={goInfo}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
          >
            <Ionicons name="information-circle" size={22} color="#fff" />
          </Pressable>

          {/* Aventura */}
          <Pressable
            style={styles.iconBtn}
            onPress={goAdventure}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
          >
            <MaterialCommunityIcons name="rocket-launch" size={22} color="#fff" />
          </Pressable>

          {/* Abrir Maps externo */}
          <Pressable
            style={styles.iconBtn}
            onPress={goDirections}
            android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
          >
            <Ionicons name="navigate" size={22} color="#fff" />
          </Pressable>

        </View>
      </View>
    </View>
  );
}

export default memo(MuseumInfoCard);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  card: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
