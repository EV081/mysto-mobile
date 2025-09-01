import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@constants/colors';

interface ImageUploaderProps {
  images: any[];
  onImagesChange: (images: any[]) => void;
  maxImages?: number;
  title?: string;
  buttonText?: string;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  title = "Imágenes",
  buttonText = "Agregar imágenes"
}: ImageUploaderProps) {
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const newImages = [...images, ...result.assets];
        if (newImages.length > maxImages) {
          Alert.alert(
            'Límite de imágenes',
            `Puedes subir máximo ${maxImages} imágenes.`
          );
          return;
        }
        onImagesChange(newImages);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la galería de imágenes');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title} (opcional)</Text>
      
      <Button
        mode="outlined"
        onPress={pickImages}
        style={styles.imageButton}
        icon="image-plus"
        disabled={images.length >= maxImages}
        labelStyle={{ color: COLORS.primary }}
      >
        {buttonText}
      </Button>

      {images.length > 0 && (
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image 
                source={{ uri: image.uri || image.url }} 
                style={styles.image} 
              />
              <IconButton
                icon="close-circle"
                size={24}
                iconColor="#ef4444"
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              />
            </View>
          ))}
        </View>
      )}

      {images.length > 0 && (
        <Text style={styles.imageCount}>
          {images.length} de {maxImages} imágenes
        </Text>
      )}
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
  imageButton: {
    marginBottom: 16,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 12,
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
  imageCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
}); 