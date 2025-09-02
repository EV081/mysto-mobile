import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Card,
  TextInput,
  Avatar,
  IconButton,
  Dialog,
  Portal,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import PostImages from '../components/Social/PostImages';
import ImageUploader from '../components/common/ImageUploader';

import { getPostById } from '@services/post/getPostById';
import { getMuseumPictures } from '@services/pictures/getPostPictures';
import { updatePost } from '@services/post/updatePost';
import { createReviewPost } from '@services/reviews/createReviewPost';
import { likeReview } from '@services/reviews/aumentarlikes';
import { getReviewsByPost } from '@services/reviews/getReviewsByPost';
import { uploadPostPictures } from '@services/pictures/uploadPostPictures';
import { deletePicture } from '@services/pictures/deletePictures';

import { useAuthContext } from '@contexts/AuthContext';
import { COLORS } from '@constants/colors';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export default function PostDetailScreen({ route }: any) {
  const { postId } = route.params;
  const { session } = useAuthContext();
  const navigation = useNavigation<any>();

  const [post, setPost] = useState<any | null>(null);
  const [images, setImages] = useState<{ id: number; url: string }[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [imageEditMode, setImageEditMode] = useState(false);
  const [newImages, setNewImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOwner = !!session;

  const load = async () => {
    setLoading(true);
    try {
      const p = await getPostById(postId);
      setPost(p);
      setContent(p.content ?? '');

      const pics = await getMuseumPictures(postId);
      setImages(pics.map((x: any) => ({ id: x.id, url: x.url })));

      const rs = await getReviewsByPost(postId);
      setReviews(rs);
    } catch (error) {
      console.error('Error loading post details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const onSave = async () => {
    try {
      setSubmitting(true);
      await updatePost(postId, { content });
      setEditing(false);
      load();
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const onCancelEdit = () => {
    setEditing(false);
    setContent(post?.content ?? '');
  };

  const onSaveImages = async () => {
    try {
      setSubmitting(true);

      for (const imageId of imagesToDelete) {
        try {
          await deletePicture(imageId);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
      if (newImages.length > 0) {
        try {
          const validImages = newImages.filter((img) => {
            const uri = (img && (img.uri || img.url)) || img;
            return uri && typeof uri === 'string' && uri.trim() !== '';
          });

          for (const img of validImages) {
            const uri = (img && (img.uri || img.url)) || img;
            await uploadPostPictures(postId, uri);
          }
        } catch (err) {
          console.error('Error uploading new images:', err);
          Alert.alert('Advertencia', 'Algunas imágenes no se pudieron subir');
        }
      }

      setImageEditMode(false);
      setNewImages([]);
      setImagesToDelete([]);
      await load();

      Alert.alert('Éxito', 'Imágenes actualizadas correctamente');
    } catch (error) {
      console.error('Error updating images:', error);
      Alert.alert('Error', 'No se pudieron actualizar las imágenes');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancelImageEdit = () => {
    setImageEditMode(false);
    setNewImages([]);
    setImagesToDelete([]);
  };

  const toggleImageDelete = (imageId: number) => {
    setImagesToDelete((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };

  const onAddReview = async (text: string) => {
    try {
      await createReviewPost(postId, { content: text, rating: 5 });
      load();
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  const onLikeReview = async (id: number) => {
    try {
      await likeReview(id);
      load();
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const handleBackPress = () => {
    navigation.navigate('RedSocial');
  };

    const handlePressMuseum = () => {
    navigation.navigate('MuseumforOneScreen', { museumId: post.museumId });
  };
  
  const getBackButtonText = () => 'Volver';
  const { dark } = useTheme();

  const authorInitial = (post?.userName ?? 'U').trim().charAt(0).toUpperCase();


  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );

  if (!post)
    return (
      <View style={styles.center}>
        <Text>Post no encontrado</Text>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBackPress} style={styles.titleButton}>
          <Text style={styles.headerTitle}>{getBackButtonText()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {images.length > 0 && (
          <View style={styles.heroCarousel}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setCurrentImageIndex(idx);
              }}
            >
              {images.map((img, index) => (
                <Image
                  key={img.id ?? index}
                  source={{ uri: img.url }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.indicator, i === currentImageIndex && styles.indicatorActive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <Card style={styles.infoCard}>
          <Card.Content style={styles.postContent}>
            {editing ? (
              <View style={styles.editContainer}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  multiline
                  mode="outlined"
                  style={styles.editInput}
                  placeholder="Edita el contenido del post..."
                />
                <View style={styles.editActions}>
                  <Button onPress={onCancelEdit} disabled={submitting}>
                    Cancelar
                  </Button>
                  <Button
                    onPress={onSave}
                    style={styles.saveButton}
                    mode="contained"
                    loading={submitting}
                    disabled={submitting || !content.trim()}
                  >
                    Guardar
                  </Button>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.postHeader}>
                   {post.userImageUrl ? (
                            <Image
                              source={{ uri: post.userImageUrl }}
                              style={[styles.avatarImage, styles.avatarBorder]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.avatarFallback,
                                { backgroundColor: dark ? COLORS.background : '#F3F4F6' },
                                styles.avatarBorder
                              ]}
                            >
                              <Text style={styles.avatarText}>{authorInitial}</Text>
                            </View>
                    )}
              
                  <View style={styles.postInfo}>
                    <Text style={styles.postAuthor}>{post.userName}</Text>
                    <Text style={styles.postDate}>
                      {new Date(post.createdAt).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                  {isOwner && (
                    <View style={styles.editButtons}>
                      <IconButton
                        icon="image-edit"
                        onPress={() => setImageEditMode(true)}
                        size={20}
                        iconColor={COLORS.primary}
                      />
                      <IconButton icon="pencil" onPress={() => setEditing(true)} size={20} />
                    </View>
                  )}
                </View>

                <Text style={styles.postText}>{post.content}</Text>
                <TouchableOpacity onPress={handlePressMuseum}> 
                  <Text style={styles.postMuseum} >🏛️: {post.museumName}</Text>
                </TouchableOpacity>
              </>
            )}
          </Card.Content>
        </Card>

        <Portal>
          <Dialog visible={imageEditMode} onDismiss={onCancelImageEdit} style={styles.imageEditDialog}>
            <Dialog.Title>Editar imágenes del post</Dialog.Title>
            <Dialog.Content>
              <ScrollView showsVerticalScrollIndicator={false}>
                {images.length > 0 && (
                  <View style={styles.currentImagesSection}>
                    <Text style={styles.sectionTitle}>Imágenes actuales</Text>
                    <View style={styles.currentImagesGrid}>
                      {images.map((image) => (
                        <View key={image.id} style={styles.currentImageWrapper}>
                          <PostImages images={[image]} />
                          <TouchableOpacity
                            style={[
                              styles.deleteImageButton,
                              imagesToDelete.includes(image.id) && styles.deleteImageButtonActive,
                            ]}
                            onPress={() => toggleImageDelete(image.id)}
                          >
                            <IconButton
                              icon={imagesToDelete.includes(image.id) ? 'check-circle' : 'delete'}
                              size={20}
                              iconColor={imagesToDelete.includes(image.id) ? '#10b981' : '#ef4444'}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    {imagesToDelete.length > 0 && (
                      <Text style={styles.deleteWarning}>
                        {imagesToDelete.length} imagen(es) marcada(s) para eliminar
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.newImagesSection}>
                  <Text style={styles.sectionTitle}>Agregar nuevas imágenes</Text>
                  <ImageUploader
                    images={newImages}
                    onImagesChange={setNewImages}
                    title=""
                    buttonText="Seleccionar imágenes"
                    maxImages={10 - images.length + imagesToDelete.length}
                  />
                </View>
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={onCancelImageEdit} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                onPress={onSaveImages}
                mode="contained"
                loading={submitting}
                disabled={submitting}
                style={{ backgroundColor: COLORS.primary }}
              >
                Guardar cambios
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Card style={styles.reviewsCard}>
          <Card.Title title="Comentarios" titleStyle={styles.commentsTitle} />
          <Card.Content>
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No hay comentarios aún. ¡Sé el primero en comentar!</Text>
            ) : (
              reviews.map((review: any) => (
                <View key={review.id} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <Avatar.Text size={32} label="U" style={styles.reviewAvatar} />
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewAuthor}>{review.userName ?? 'Usuario'}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => onLikeReview(review.id)}>
                      <View style={styles.likeContainer}>
                        <IconButton icon="heart" size={20} iconColor="#E91E63" />
                        <Text style={styles.likeCount}>{review.likes ?? 0}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reviewContent}>{review.content}</Text>
                </View>
              ))
            )}
          </Card.Content>

          <Card.Content style={styles.addReviewContainer}>
            <AddReviewBox onSubmit={onAddReview} />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function AddReviewBox({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit(text.trim());
      setText('');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.addReviewBox}>
      <TextInput
        mode="outlined"
        placeholder="Añade un comentario…"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={3}
        style={styles.reviewInput}
        outlineColor="#D1D5DB"
        activeOutlineColor={COLORS.primary}
      />

      <TouchableOpacity
        style={[styles.ctaButton, (submitting || !text.trim()) && styles.ctaButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !text.trim()}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.ctaButtonText}>Enviar comentario</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    postMuseum: {
    fontSize: 13,
    color: COLORS.light.textSecondary,
    lineHeight: 24,
    marginTop: 25,    
    fontStyle: 'italic',
  },
    avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12, 
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: '#000000ff',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  heroCarousel: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  carouselImage: {
    width: screenWidth,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
    backgroundColor: '#fff',
  },
  indicatorActive: {
    opacity: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  backButton: { marginRight: 16, padding: 4 },
  titleButton: { flex: 1, padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },

  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { paddingBottom: 24 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCard: {
    marginTop: 16,           
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  postContent: { padding: 16 },

  editContainer: { gap: 16 },
  editInput: { minHeight: 100 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, color: COLORS.primary },
  saveButton: { minWidth: 100 },

  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { backgroundColor: COLORS.primary, marginRight: 12 },
  postInfo: { flex: 1 },
  postAuthor: { fontWeight: '600', fontSize: 16, color: '#262626' },
  postDate: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
  editButtons: { flexDirection: 'row', alignItems: 'center' },
  postText: { fontSize: 16, color: COLORS.black, lineHeight: 24, marginTop: 8 },

  reviewsCard: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#fff',
    borderColor: COLORS.black,
    borderWidth: 1,
    marginTop: 16,
    marginHorizontal: 16,
  },
  commentsTitle: { color: COLORS.primary, fontWeight: 'bold', fontSize: 18 },
  noReviews: { textAlign: 'center', color: '#8e8e93', fontStyle: 'italic', paddingVertical: 20 },
  review: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: { backgroundColor: COLORS.primary, marginRight: 12 },
  reviewInfo: { flex: 1 },
  reviewAuthor: { fontWeight: '600', fontSize: 14, color: '#262626' },
  reviewDate: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
  likeContainer: { flexDirection: 'row', alignItems: 'center' },
  likeCount: { fontSize: 14, color: '#E91E63', fontWeight: '600', marginLeft: -8 },
  reviewContent: { fontSize: 14, color: '#262626', lineHeight: 20, marginLeft: 44 },
  addReviewContainer: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  addReviewBox: { gap: 12 },
  reviewInput: { minHeight: 80 },

  ctaButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 90,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-end',
    minWidth: 120,
  },
  ctaButtonDisabled: { backgroundColor: '#9ca3af' },
  ctaButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  imageEditDialog: { maxHeight: '90%', backgroundColor: COLORS.background },
  currentImagesSection: { marginBottom: 20 },
  newImagesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#262626' },
  currentImagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  currentImageWrapper: { position: 'relative', width: 120, height: 120 },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  deleteImageButtonActive: { backgroundColor: 'rgba(16,185,129,0.1)' },
  deleteWarning: { fontSize: 12, color: '#ef4444', fontStyle: 'italic', textAlign: 'center' },
});
