import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '@constants/colors';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';

interface CulturalObjectsListProps {
  objects: CulturalObjectResponse[];
  onObjectPress: (object: CulturalObjectResponse) => void;
  onEditObject?: (object: CulturalObjectResponse) => void;
  onDeleteObject?: (objectId: number) => void;
  showActions?: boolean;
  isSearching?: boolean;
  searchQuery?: string;
  /** Optional map of objectId -> similarity percentage (0-100) to show a badge */
  similarityMap?: Record<number, number>;
}

export const CulturalObjectsList: React.FC<CulturalObjectsListProps> = ({
  objects,
  onObjectPress,
  onEditObject,
  onDeleteObject,
  showActions = false,
  isSearching = false,
  searchQuery = '',
  similarityMap,
}) => {
  if (isSearching) {
    return (
      <View style={styles.searchLoadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="small" />
        <Text style={styles.searchLoadingText}>Buscando...</Text>
      </View>
    );
  }

  if (objects.length === 0) {
    return (
      <Text style={styles.info}>
        {searchQuery ? 'No se encontraron objetos que coincidan con la búsqueda.' : 'No hay objetos culturales asociados.'}
      </Text>
    );
  }

  return (
    <FlatList
      data={objects}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onObjectPress(item)}
          style={styles.objectCard}
        >
          {item.pictureUrls && item.pictureUrls.length > 0 && (
            <Image source={{ uri: item.pictureUrls[0] }} style={styles.objectImage} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.objectTitle} numberOfLines={3}>{item.name}</Text>
            <Text style={styles.objectDesc} numberOfLines={3}>{item.description}</Text>

            {typeof similarityMap !== 'undefined' && similarityMap[item.id] != null && (
              <Text style={styles.similarityText}>Similitud: {similarityMap[item.id].toFixed(1)}%</Text>
            )}

            {showActions && onEditObject && onDeleteObject && (
              <View style={styles.objectActions}>
                <TouchableOpacity 
                  onPress={() => onEditObject(item)}
                  style={styles.editObjectButton}
                >
                  <Text style={styles.editObjectText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => onDeleteObject(item.id)}
                  style={styles.deleteObjectButton}
                >
                  <Text style={styles.deleteObjectText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
      scrollEnabled={false}
      nestedScrollEnabled={true}
    />
  );
};

const styles = StyleSheet.create({
  objectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.black
  },
  objectImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.background
  },
  objectTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.primary
  },
  objectDesc: {
    color: COLORS.text,
    fontSize: 13
  },
  objectActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editObjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.button.primary,
    borderRadius: 4,
  },
  editObjectText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  deleteObjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.button.danger,
    borderRadius: 4,
  },
  deleteObjectText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 14,
    color: COLORS.text,
  },
  similarityText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '600'
  },
  info: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4
  },
}); 