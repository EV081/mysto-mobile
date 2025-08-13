import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = 350;
const IMAGE_HEIGHT = 230;

export default function MuseumImagesCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const horizontalPadding = (SCREEN_WIDTH - IMAGE_WIDTH) / 2;

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: images[currentIndex] }} style={styles.image} resizeMode="cover" />

        {currentIndex > 0 && (
          <TouchableOpacity style={[styles.arrow, styles.leftArrow]} onPress={goPrev}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
        )}

        {currentIndex < images.length - 1 && (
          <TouchableOpacity style={[styles.arrow, styles.rightArrow]} onPress={goNext}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: IMAGE_HEIGHT,
  },
  imageWrapper: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  arrowText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
