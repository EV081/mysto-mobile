import { useState, useEffect, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, useFocusEffect, NavigationProp as BaseNavigationProp } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { CulturalObjectType } from '@interfaces/cuturalObject/CulturalObjectType';
import { AlbumResponseDto } from '../interfaces/album/AlbumResponse';
import { getCulturalObjectInfo } from '@services/culturalObject/getCulturalObjectInfo';
import { getThemeColors } from '@constants/colors';
import { getReviewsByCulturalObject } from '@services/reviews/getReviewsByCulturalObject';
import { createReviewCulturalObject } from '@services/reviews/createReviewCulturalObject';
import { ReviewResponseDto } from '@interfaces/reviews/ReviewResponse';
import { useAuthState } from '../hooks/useAuth';
import SimilarObjectsButton from '@components/ImageRecognition/SimilarObjectsButton';
import { CulturalObjectsList } from '@components/CulturalObjectsList';
import { COLORS } from '@constants/colors';

type ObjectDetailRouteProp = RouteProp<{
  ObjectDetail: {
    albumItem: AlbumResponseDto;
    culturalObject?: CulturalObjectResponse; 
    fromScreen?: 'Album' | 'RedSocial' | 'Museo'; 
  };
}, 'ObjectDetail'>;

type NavigationProp = BaseNavigationProp<{
  Album: undefined;
  RedSocial: undefined;
  Home: undefined;
  Museo: undefined;
  ObjectDetail: any;
}>;

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
  const { session } = useAuthState();
  
  const { albumItem, culturalObject, fromScreen } = route.params;
  const [objectDetail, setObjectDetail] = useState<CulturalObjectResponse | null>(culturalObject || null);
  const [loading, setLoading] = useState(!culturalObject);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [similarObjects, setSimilarObjects] = useState<CulturalObjectResponse[]>([]);
  const [similarityMap, setSimilarityMap] = useState<Record<number, number>>({});
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (fromScreen) {
      navigation.getParent()?.navigate(fromScreen as any);
    }
  };

  const getBackButtonText = () => {
    switch (fromScreen) {
      case 'Album':
        return 'Volver';
      case 'RedSocial':
        return 'Volver';
      case 'Museo':
        return 'Volver';
      default:
        return 'Volver';
    }
  };
  
  const loadObjectDetail = useCallback(async () => {
    if (culturalObject) {
      setObjectDetail(culturalObject);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setCurrentImageIndex(0);
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
            onPress: handleBackPress,
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [albumItem.id, culturalObject]);

  const fetchReviews = useCallback(async () => {
    if (!albumItem.id) return;
    
    try {
      setLoadingReviews(true);
      const reviewsData = await getReviewsByCulturalObject(albumItem.id, 0, 20);
      setReviews(reviewsData.contents || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [albumItem.id]);

  const handleCommentSubmit = async () => {
    const commentText = commentInput.trim();
    
    if (!commentText) {
      Alert.alert('Error', 'Por favor ingresa un comentario');
      return;
    }

    if (commentText.length < 10) {
      Alert.alert('Error', 'El comentario debe tener al menos 10 caracteres para que el análisis de sentimiento funcione correctamente');
      return;
    }

    if (commentText.length > 500) {
      Alert.alert('Error', 'El comentario no puede exceder 500 caracteres');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Error', 'La calificación debe ser entre 1 y 5 estrellas');
      return;
    }

    if (!session) {
      Alert.alert('Error', 'Debes iniciar sesión para comentar');
      return;
    }

    try {
      setSubmittingComment(true);
      
      const reviewData = {
        content: commentText.trim(),
        rating: rating
      };
      
      await createReviewCulturalObject(albumItem.id, reviewData);
      
      setCommentInput('');
      setRating(5);
      
      await fetchReviews();
      
      Alert.alert('Éxito', 'Comentario y calificación agregados correctamente');
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', error.message || 'No se pudo agregar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderRatingSelector = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={{ marginHorizontal: 2 }}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={20}
            color={i <= rating ? '#fbbf24' : '#d1d5db'}
          />
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {stars}
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadObjectDetail();
    }, [loadObjectDetail])
  );

  useEffect(() => {
    loadObjectDetail();
  }, [loadObjectDetail, albumItem.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
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
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
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
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleBackPress} style={styles.titleButton}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{getBackButtonText()}</Text>
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

              {objectDetail.coins && (
                <View style={styles.rewardContainer}>
                  <Ionicons name="gift-outline" size={16} color="#f59e0b" />
                  <Text style={[styles.rewardText, { color: colors.text }]}>
                    {objectDetail.coins}
                  </Text>
                </View>
              )}

              <Text style={[styles.description, { color: colors.text }]}>
                {objectDetail.description}
              </Text>

              {objectDetail.reviews && objectDetail.reviews.length > 0 && (
                <View style={styles.reviewsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Reseñas
                  </Text>
                  <View style={styles.reviewCount}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.reviewCountText, { color: colors.textSecondary }]}>
                      {objectDetail.reviews.length} reseña{objectDetail.reviews.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
          
          {/* Similar Objects Button */}
          <Card style={[styles.card, { backgroundColor: colors.cardBackground, marginTop: 16 }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Descubrir Objetos Similares
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Encuentra objetos culturales similares a este
              </Text>
              <SimilarObjectsButton
                objectId={albumItem.id}
                objectName={objectDetail.name}
                topK={3}
                onSimilarObjectsResult={async (results) => {
                  try {
                    setLoadingSimilar(true);
                    // results contain id and combined_score; fetch full object info for each id
                    const fetchedObjects: CulturalObjectResponse[] = [];
                    const simMap: Record<number, number> = {};

                    for (const r of results) {
                      try {
                        const resp = await getCulturalObjectInfo(r.id);
                        fetchedObjects.push(resp.data);
                        simMap[r.id] = +(r.combined_score * 100);
                      } catch (err) {
                        console.warn('No se pudo obtener objeto similar con id', r.id, err);
                      }
                    }

                    setSimilarObjects(fetchedObjects);
                    setSimilarityMap(simMap);
                  } finally {
                    setLoadingSimilar(false);
                  }
                }}
                onError={(error) => {
                  console.error('Error:', error);
                }}
                style={[styles.similarObjectsButton, { backgroundColor: COLORS.button.primary }]}
              />
              {/* Render similar objects list if available */}
              {loadingSimilar ? (
                <View style={{ paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Cargando objetos similares...</Text>
                </View>
              ) : similarObjects.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                    Objetos similares encontrados
                  </Text>
                  <CulturalObjectsList
                    objects={similarObjects}
                    onObjectPress={(obj) => {
                      // Navigate to the same ObjectDetail but preserve similarObjects state in this screen instance
                      (navigation as any).push('ObjectDetail', {
                        albumItem: {
                          id: obj.id,
                          name: obj.name,
                          description: obj.description,
                          type: obj.type,
                          pictureUrls: obj.pictureUrls,
                          isObtained: true,
                        },
                        culturalObject: obj,
                        fromScreen: fromScreen || 'Home'
                      });
                    }}
                    similarityMap={similarityMap}
                  />
                </View>
              ) : null}
            </View>
          </Card>
          
          {/* Comments Section */}
          <Card style={[styles.card, { backgroundColor: colors.cardBackground, marginTop: 16 }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Comentarios y Calificaciones
              </Text>
              
              {/* Add Comment Section */}
              {session && (
                <View style={styles.addCommentSection}>
                  <Text style={[styles.addCommentLabel, { color: colors.text }]}>Agregar comentario:</Text>
                  
                  {/* Rating Selector */}
                  <View style={styles.ratingSection}>
                    <Text style={[styles.ratingLabel, { color: colors.text }]}>Tu calificación:</Text>
                    {renderRatingSelector()}
                  </View>
                  
                  {/* Comment Input */}
                  <TextInput
                    style={[styles.commentInput, { 
                      borderColor: colors.textSecondary, 
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    placeholder="Escribe tu comentario aquí..."
                    placeholderTextColor={colors.textSecondary}
                    value={commentInput}
                    onChangeText={setCommentInput}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                  
                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      submittingComment && styles.submitButtonDisabled
                    ]}
                    onPress={handleCommentSubmit}
                    disabled={submittingComment || !commentInput.trim()}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.submitButtonText}>Enviar Comentario</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Comments List */}
              <View style={styles.commentsSection}>
                {loadingReviews ? (
                  <View style={[styles.loadingContainer, { paddingVertical: 20 }]}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Cargando comentarios...
                    </Text>
                  </View>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <View key={review.id} style={[styles.commentItem, { borderBottomColor: colors.textSecondary }]}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentRating}>
                          {[...Array(5)].map((_, starIdx) => (
                            <Ionicons
                              key={starIdx}
                              name={starIdx < review.rating ? 'star' : 'star-outline'}
                              size={14}
                              color={starIdx < review.rating ? '#fbbf24' : colors.textSecondary}
                            />
                          ))}
                        </View>
                        <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                          {new Date(review.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: colors.text }]}>
                        {review.content}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                    Sin comentarios aún. ¡Sé el primero en comentar!
                  </Text>
                )}
              </View>
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
  addCommentSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  addCommentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingSection: {
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 12,
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentRating: {
    flexDirection: 'row',
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  similarObjectsButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
});