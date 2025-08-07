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
      {museum.pictureUrl && (
        <Image source={{ uri: museum.pictureUrl }} style={styles.image} />
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{museum.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{museum.description}</Text>
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
  card: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 10, marginBottom: 12, elevation: 2, padding: 10 },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: COLORS.background },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontWeight: 'bold', fontSize: 16, color: COLORS.primary },
  desc: { color: COLORS.text, fontSize: 13 },
  editButton: { marginLeft: 10 },
});