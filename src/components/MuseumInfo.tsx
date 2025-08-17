import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Linking, Platform } from 'react-native';
import { COLORS } from '@constants/colors';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';
import MuseumImagesCarousel from './MuseumForm/MuseumImagesCarousel';

interface MuseumInfoProps {
  museum: MuseumResponse;
  onMapPress: (lat: number | string, lon: number | string) => void;
}

export const MuseumInfo: React.FC<MuseumInfoProps> = ({ museum, onMapPress }) => {
  const formatHour = (time?: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  return (
    <View>
      {museum.pictureUrls && museum.pictureUrls.length > 0 && (
        <MuseumImagesCarousel images={museum.pictureUrls} />
      )}
      <Text style={[styles.title, { marginTop: 10 }]}>{museum.name}</Text>
      <Text style={styles.desc}>{museum.description}</Text>
      
      <TouchableOpacity onPress={() => onMapPress(museum.latitude as number, museum.longitude as number)}>
        <Text style={[styles.info, { color: COLORS.blue[600], textDecorationLine: 'underline' }]}>
          Ver en el mapa
        </Text>
      </TouchableOpacity>

      {museum.openTime && museum.closeTime && (
        <Text style={styles.info}>
          Abre: {formatHour(museum.openTime)} - Cierra: {formatHour(museum.closeTime)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8
  },
  desc: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8
  },
  info: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4
  },
}); 