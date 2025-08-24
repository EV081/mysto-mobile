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
};

const openExternalDirections = async (dest: LatLng, origin?: LatLng | null) => {
  try {
    const base = 'https://www.google.com/maps/dir/?api=1';
    const destination = `destination=${dest.latitude},${dest.longitude}`;
    const originPart = origin ? `&origin=${origin.latitude},${origin.longitude}` : '';
    const url = `${base}&${destination}${originPart}&travelmode=driving`;

    if (Platform.OS === 'ios') {
      const appleUrl = `maps://?daddr=${dest.latitude},${dest.longitude}${origin ? `&saddr=${origin.latitude},${origin.longitude}` : ''}`;
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
}: Props) {
  const navigation = useNavigation<any>();

  const containerStyle = useMemo(() => {
    return [
      styles.wrap,
      placement === 'top'
        ? { top: 12, bottom: undefined }
        : { bottom: 12, top: undefined },
    ];
  }, [placement]);

  const goInfo = useCallback(() => {
    if (!museum) return;
    navigation.navigate(infoScreenName, { museumId: museum.id });
  }, [navigation, museum, infoScreenName]);

  const goAdventure = useCallback(() => {
    if (!museum) return;
    navigation.navigate(adventureScreenName, {
      museumId: museum.id,
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

        {/* Botones SOLO con íconos (3 botones) */}
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} onPress={goDirections} android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}>
            <Ionicons name="navigate" size={22} color="#fff" />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={goInfo} android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}>
            <Ionicons name="information-circle" size={22} color="#fff" />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={goAdventure} android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}>
            <MaterialCommunityIcons name="rocket-launch" size={22} color="#fff" />
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
    backgroundColor: '#000', // fondo negro
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
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' }, // texto claro
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', // contraste en negro
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
    backgroundColor: 'rgba(255,255,255,0.06)', // leve contraste
  },
});
