import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions, Text } from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';

interface PostImagesProps {
  images: { id: number; url: string }[];
  maxImagesToShow?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function PostImages({ images, maxImagesToShow = 3 }: PostImagesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Si solo hay una imagen, mostrarla completa
  if (images.length === 1) {
    return (
      <View style={styles.singleImageContainer}>
        <Image 
          source={{ uri: images[0].url }} 
          style={styles.singleImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Si hay múltiples imágenes, mostrar grid con indicador
  const imagesToShow = images.slice(0, maxImagesToShow);
  const hasMoreImages = images.length > maxImagesToShow;

  return (
    <View style={styles.container}>
      <View style={styles.imagesGrid}>
        {imagesToShow.map((image, index) => (
          <View key={image.id} style={styles.imageWrapper}>
            <Image 
              source={{ uri: image.url }} 
              style={styles.gridImage}
              resizeMode="cover"
            />
            {index === maxImagesToShow - 1 && hasMoreImages && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>+{images.length - maxImagesToShow}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      
      {/* Indicadores de imagen */}
      {images.length > 1 && (
        <View style={styles.indicators}>
          {imagesToShow.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentIndex ? COLORS.primary : '#ccc',
                  opacity: index === currentIndex ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  singleImageContainer: {
    paddingHorizontal: 8,
  },
  singleImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imagesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});