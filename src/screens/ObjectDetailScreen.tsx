import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { CulturalObjectResponseDto, CulturalObjectType } from '../interfaces/object/CulturalObjectResponse';
import { AlbumResponseDto } from '../interfaces/album/AlbumResponse';
import { getCulturalObjectInfo } from '@services/object/culturalObject';
import { getThemeColors } from '@constants/colors';

type ObjectDetailRouteProp = RouteProp<{
  ObjectDetail: {
    albumItem: AlbumResponseDto;
  };
}, 'ObjectDetail'>;

type NavigationProp = {
  navigate: (screen: 'Album' | 'Home' | 'ObjectDetail', params?: any) => void;
  goBack: () => void;
};

const { width: screenWidth } = Dimensions.get('window');

const typeTranslations: Record<CulturalObjectType, string> = {
  [CulturalObjectType.CERAMICS]: 'Cerámica',
  [CulturalObjectType.TEXTILES]: 'Textiles',
  [CulturalObjectType.PAINTING]: 'Pintura',
  [CulturalObjectType.GOLDSMITHING]: 'Orfebrería',
};

export default function ObjectDetailScreen() {
  const route = useRoute<ObjectDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  
  const { albumItem } = route.params;
  const [objectDetail, setObjectDetail] = useState<CulturalObjectResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadObjectDetail();
  }, []);

  const loadObjectDetail = async () => {
    try {
      setLoading(true);
      const response = await getCulturalObjectInfo(albumItem.id);
      setObjectDetail(response.data);
    } catch (error) {
      console.error('Error loading object detail:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar la información del objeto',
        [
          {
            text: 'Volver',
            onPress: () => navigation.navigate('Album'),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (qualification: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= qualification ? 'star' : 'star-outline'}
          size={16}
          color={i <= qualification ? '#fbbf24' : colors.textSecondary}
        />
      );
    }
    return stars;
  };

  const renderImageCarousel = () => {
    const images = objectDetail?.pictureUrls || albumItem.pictureUrls || [];
    
    if (images.length === 0) {
      return (
        <View style={[styles.placeholderImage, { backgroundColor: colors.background }]}>
          <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
        </View>
      );
    }

    return (
      <View style={styles.imageCarouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentImageIndex(index);
          }}
        >
          {images.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentImageIndex ? '#1e40af' : colors.textSecondary,
                    opacity: index === currentImageIndex ? 1 : 0.5,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  if (!objectDetail) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Error</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Album')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Album')} style={styles.titleButton}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderImageCarousel()}

        <View style={styles.infoContainer}>
          <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardContent}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {objectDetail.name}
                </Text>
                <View style={styles.obtainedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.obtainedText}>Obtenido</Text>
                </View>
              </View>

              <View style={styles.metaInfo}>
                <View style={styles.typeContainer}>
                  <Ionicons name="bookmark-outline" size={16} color="#1e40af" />
                  <Text style={[styles.type, { color: '#1e40af' }]}>
                    {typeTranslations[objectDetail.type] || objectDetail.type}
                  </Text>
                </View>

                <View style={styles.ratingContainer}>
                  <View style={styles.stars}>
                    {renderStars(objectDetail.qualification)}
                  </View>
                  <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                    ({objectDetail.qualification}/5)
                  </Text>
                </View>
              </View>

              <View style={styles.museumInfo}>
                <Ionicons name="library-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.museumName, { color: colors.textSecondary }]}>
                  {objectDetail.museumName}
                </Text>
              </View>

              {objectDetail.reward && (
                <View style={styles.rewardContainer}>
                  <Ionicons name="gift-outline" size={16} color="#f59e0b" />
                  <Text style={[styles.rewardText, { color: colors.text }]}>
                    {objectDetail.reward}
                  </Text>
                </View>
              )}

              <Text style={[styles.description, { color: colors.text }]}>
                {objectDetail.description}
              </Text>

              {objectDetail.reviewIds && objectDetail.reviewIds.length > 0 && (
                <View style={styles.reviewsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Reseñas
                  </Text>
                  <View style={styles.reviewCount}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.reviewCountText, { color: colors.textSecondary }]}>
                      {objectDetail.reviewIds.length} reseña{objectDetail.reviewIds.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  titleButton: {
    flex: 1,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageCarouselContainer: {
    position: 'relative',
  },
  carouselImage: {
    width: screenWidth,
    height: 300,
  },
  placeholderImage: {
    width: screenWidth,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoContainer: {
    padding: 16,
  },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
    lineHeight: 30,
  },
  obtainedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  obtainedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
  },
  museumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  museumName: {
    fontSize: 14,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  reviewsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCountText: {
    fontSize: 14,
    marginLeft: 6,
  },
});