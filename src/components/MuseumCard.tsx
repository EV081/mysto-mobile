import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';

interface MuseumCardProps {
  museum: any;
  onPress: () => void;
  onEdit?: () => void;
  disabled?: boolean;
}

export default function MuseumCard({ museum, onPress, onEdit, disabled = false }: MuseumCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={disabled}>
    {museum.pictureUrls && museum.pictureUrls.length > 0 && (
      <Image source={{ uri: museum.pictureUrls[0] }} style={styles.image} />
    )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={3}>{museum.name}</Text>
        <Text style={styles.desc} numberOfLines={4}>{museum.description}</Text>
      </View>
      {onEdit && (
        <IconButton
          icon="pencil"
          size={20}
          onPress={onEdit}
          iconColor={COLORS.primary}
          style={styles.editButton}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    padding: 14,
    alignItems: 'center',
    minHeight: 140 // asegura que toda la tarjeta sea más alta
  },
  image: {
    width: 120, // más grande
    height: 110,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.background
  },
  info: {
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 4
  },
  desc: {
    color: COLORS.text,
    fontSize: 13
  },
  editButton: {
    marginLeft: 10
  }
});
