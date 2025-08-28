import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { COLORS } from '@constants/colors';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';
import MuseumImagesCarousel from './MuseumForm/MuseumImagesCarousel';
import { Card, Divider } from 'react-native-paper';

interface MuseumInfoProps {
  museum: MuseumResponse;
  onMapPress: (lat: number | string, lon: number | string) => void;
}

export const MuseumInfo: React.FC<MuseumInfoProps> = ({ museum, onMapPress }) => {
  const isDark = useColorScheme() === 'dark';
  const formatHour = (t?: string) => (t ? t.substring(0, 5) : '');

  return (
    <View style={{ marginBottom: 20 }}>
      {!!museum.pictureUrls?.length && (
        <View style={styles.imageWrapper}>
          <MuseumImagesCarousel images={museum.pictureUrls} />
        </View>
      )}

      <Card
        style={[styles.card, { borderColor: COLORS.black, backgroundColor: COLORS.light.background }]}
      >
        <Card.Content style={styles.cardContent}>
          <Text style={[styles.title, { color: COLORS.primary }]}>{museum.name}</Text>
          {!!museum.description && (
            <Text style={[styles.desc, { color: COLORS.text }]}>{museum.description}</Text>
          )}

          <TouchableOpacity
            onPress={() => onMapPress(museum.latitude as number, museum.longitude as number)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={[styles.link, { color: COLORS.primary }]}>Ver en el mapa</Text>
          </TouchableOpacity>

          {!!museum.openTime && !!museum.closeTime && (
            <>
              <Divider style={{ marginVertical: 10, opacity: 0.2 }} />
              <Text style={[styles.info, { color: COLORS.text }]}>
                Abre: {formatHour(museum.openTime)} — Cierra: {formatHour(museum.closeTime)}
              </Text>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
  },
  cardContent: {
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'justify',
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'justify',
    marginBottom: 12,
  },
 link: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: 6,
    textAlign: 'left', 
  },
  info: {
    fontSize: 13,
    textAlign: 'left',
  },
});
