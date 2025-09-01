import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';

interface ImageGalleryProps {
  images: { id: number; url: string }[];
  onImagesChange: (images: { id: number; url: string }[]) => void;
  onDeleteImage?: (id: number) => Promise<void>;
  title?: string;
  loading?: boolean;
  showDeleteButton?: boolean;
}

export default function ImageGallery({
  images,
  onImagesChange,
  onDeleteImage,
  title = "Imágenes existentes",
  loading = false,
  showDeleteButton = true,
}: ImageGalleryProps) {
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const removeExistingImage = (imageId: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta imagen?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingImageId(imageId);
            try {
              if (onDeleteImage) {
                await onDeleteImage(imageId);
              } else {
                const newImages = images.filter(img => img.id !== imageId);
                onImagesChange(newImages);
              }
              Alert.alert('Éxito', 'Imagen eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la imagen');
            } finally {
              setDeletingImageId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando imágenes...</Text>
        </View>
      </View>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>

      <View style={styles.imagesContainer}>
        {images.map((image) => (
          <View key={image.id} style={styles.imageWrapper}>
            <Image
              source={{ uri: image.url }}
              style={styles.image}
            />
            {showDeleteButton && (
              <IconButton
                icon="close-circle"
                size={24}
                iconColor="#ef4444"
                style={styles.removeImageButton}
                onPress={() => removeExistingImage(image.id)}
                disabled={deletingImageId === image.id}
              />
            )}
            {deletingImageId === image.id && (
              <View style={styles.deletingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
        ))}
      </View>

      <Text style={styles.imageCount}>
        {images.length} imagen{images.length !== 1 ? 'es' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
