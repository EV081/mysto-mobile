import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@constants/colors';

interface MuseumHeaderProps {
  onBack: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export const MuseumHeader: React.FC<MuseumHeaderProps> = ({ 
  onBack, 
  onDelete, 
  showDeleteButton = false 
}) => {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalles del Museo
        </Text>
        {showDeleteButton && onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerLine} />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',         
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,         
    backgroundColor: COLORS.white,
  },
  headerLine: {
    height: 2,
    backgroundColor: COLORS.gray[200],
    width: '100%',
    shadowColor: COLORS.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.primary,
    marginRight: 12,
    lineHeight: 28, 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flexShrink: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: 0,
  },
  deleteButton: {
    backgroundColor: COLORS.button.danger,
    paddingVertical: 10,
    right: -50,   
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 