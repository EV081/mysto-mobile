import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { getListAllObjects } from '@services/museum/getListAllObjects';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthState } from '../hooks/useAuth';
import { COLORS } from '@constants/colors';
import { Button } from 'react-native-paper';
import { createReviewCulturalObject } from '@services/reviews/createReviewCulturalObject';
import { getReviewsByCulturalObject } from '@services/reviews/getReviewsByCulturalObject';
import { ReviewResponseDto } from '@interfaces/reviews/ReviewResponse';
import { Ionicons } from '@expo/vector-icons';

interface ObjetosListadosProps {
    onObjectPress?: (objectId: string) => void;
}

export default function ObjetosListados({ onObjectPress }: ObjetosListadosProps) {
    const { session } = useAuthState();
    const [objetos, setObjetos] = useState<CulturalObjectResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
    const [ratings, setRatings] = useState<{ [key: number]: number }>({});
    const [submittingComments, setSubmittingComments] = useState<{ [key: number]: boolean }>({});
    const [reviews, setReviews] = useState<{ [key: number]: ReviewResponseDto[] }>({});
    const [loadingReviews, setLoadingReviews] = useState<{ [key: number]: boolean }>({});
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const objectId = route?.params?.objectId || 1; 

    useEffect(() => {
        fetchData();
    }, [objectId, session]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getListAllObjects(0, 10, objectId);
            setObjetos(data.contents || []);
            setError(null);

            // Fetch reviews for each cultural object
            if (data.contents && data.contents.length > 0) {
                for (const objeto of data.contents) {
                    fetchReviewsForObject(objeto.id);
                }
            }
        } catch (err) {
            console.error('Error al obtener objetos:', err);
            setError('No se pudieron cargar los objetos.');
            setObjetos([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviewsForObject = async (culturalObjectId: number) => {
        try {
            setLoadingReviews(prev => ({ ...prev, [culturalObjectId]: true }));
            const reviewsData = await getReviewsByCulturalObject(culturalObjectId, 0, 10);
            setReviews(prev => ({ ...prev, [culturalObjectId]: reviewsData.contents || [] }));
        } catch (error) {
            console.error(`Error fetching reviews for object ${culturalObjectId}:`, error);
            // Set empty array if there's an error or no reviews
            setReviews(prev => ({ ...prev, [culturalObjectId]: [] }));
        } finally {
            setLoadingReviews(prev => ({ ...prev, [culturalObjectId]: false }));
        }
    };

    useEffect(() => {
        if (session) {
            fetchData();
        } else {
            setLoading(false);
            setError('Necesitas iniciar sesión para ver los objetos culturales.');
        }
    }, [objectId, session]);

    const convertToAlbumItem = (item: CulturalObjectResponse) => {
        return {
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type,
            pictureUrls: item.pictureUrls,
            isObtained: true, 
        };
    };

    const handleCommentSubmit = async (culturalObjectId: number) => {
        const commentText = commentInputs[culturalObjectId]?.trim();
        const rating = ratings[culturalObjectId] || 5; // Default to 5 stars if not selected
        
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
            setSubmittingComments(prev => ({ ...prev, [culturalObjectId]: true }));
            
            const reviewData = {
                content: commentText.trim(),
                rating: rating
            };
            
            console.log('Submitting review with data:', reviewData);
            console.log('Cultural object ID:', culturalObjectId);
            
            await createReviewCulturalObject(culturalObjectId, reviewData);
            
            // Clear the input and rating
            setCommentInputs(prev => ({ ...prev, [culturalObjectId]: '' }));
            setRatings(prev => ({ ...prev, [culturalObjectId]: 5 }));
            
            // Refresh reviews for this specific object
            await fetchReviewsForObject(culturalObjectId);
            
            Alert.alert('Éxito', 'Comentario y calificación agregados correctamente');
        } catch (error: any) {
            console.error('Error submitting comment:', error);
            Alert.alert('Error', error.message || 'No se pudo agregar el comentario');
        } finally {
            setSubmittingComments(prev => ({ ...prev, [culturalObjectId]: false }));
        }
    };

    const updateCommentInput = (culturalObjectId: number, text: string) => {
        setCommentInputs(prev => ({ ...prev, [culturalObjectId]: text }));
    };

    const updateRating = (culturalObjectId: number, rating: number) => {
        setRatings(prev => ({ ...prev, [culturalObjectId]: rating }));
    };

    const renderStars = (culturalObjectId: number) => {
        const currentRating = ratings[culturalObjectId] || 5;
        const stars = [];
        
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => updateRating(culturalObjectId, i)}
                    style={{ marginHorizontal: 2 }}
                >
                    <Ionicons
                        name={i <= currentRating ? 'star' : 'star-outline'}
                        size={20}
                        color={i <= currentRating ? '#fbbf24' : '#d1d5db'}
                    />
                </TouchableOpacity>
            );
        }
        
        return (
            <View style={styles.starsContainer}>
                <Text style={styles.ratingLabel}>Calificación:</Text>
                <View style={styles.starsRow}>
                    {stars}
                </View>
            </View>
        );
    };

    const handleObjectPressFromRedSocial = useCallback((item: CulturalObjectResponse) => {
    navigation.push('ObjectDetail', { 
        albumItem: convertToAlbumItem(item),
        culturalObject: item,
        fromScreen: 'RedSocial'
    });
    }, [navigation, convertToAlbumItem]);

    const renderItem = ({ item }: { item: CulturalObjectResponse }) => (
        <View style={styles.publicationCard}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleObjectPressFromRedSocial(item)}
            >
                {item.pictureUrls && item.pictureUrls.length > 0 ? (
                    <Image
                        source={{ uri: item.pictureUrls[0] }}
                        style={styles.publicationImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.publicationImage, styles.noImage]}>
                        <Text style={styles.noImageText}>No image</Text>
                    </View>
                )}
            </TouchableOpacity>
            <View style={styles.publicationInfo}>
                <Text style={styles.publicationName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                </Text>
                {item.description && (
                    <Text style={styles.publicationDescription} numberOfLines={3} ellipsizeMode="tail">
                        {item.description}
                    </Text>
                )}
                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                        <Text style={{ fontWeight: 'bold' }}>Puntos:</Text> {item.points}   <Text style={{ fontWeight: 'bold' }}>Monedas:</Text> {item.coins}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                        <Text style={{ fontWeight: 'bold' }}>Calificación:</Text> {item.qualification} / 5
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                        <Text style={{ fontWeight: 'bold' }}>Tipo:</Text> {item.type}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                        <Text style={{ fontWeight: 'bold' }}>Museo:</Text> {item.museumName}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 14,
                }}>
                    <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 }}>Comentarios:</Text>
                    {loadingReviews[item.id] ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>Cargando comentarios...</Text>
                        </View>
                    ) : reviews[item.id] && reviews[item.id].length > 0 ? (
                        reviews[item.id].slice(0, 3).map((review, idx) => (
                            <View key={review.id} style={{ marginBottom: 4 }}>
                                <Text style={{ fontSize: 13, color: '#334155', marginBottom: 1 }} numberOfLines={2} ellipsizeMode="tail">
                                    • {review.content}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                                        {[...Array(5)].map((_, starIdx) => (
                                            <Ionicons
                                                key={starIdx}
                                                name={starIdx < review.rating ? 'star' : 'star-outline'}
                                                size={12}
                                                color={starIdx < review.rating ? '#fbbf24' : '#d1d5db'}
                                            />
                                        ))}
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={{ fontSize: 13, color: '#64748b' }}>Sin comentarios.</Text>
                    )}
                    {reviews[item.id] && reviews[item.id].length > 3 && (
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            ...y {reviews[item.id].length - 3} comentarios más
                        </Text>
                    )}
                </View>
                
                {/* Comment input section */}
                {session && (
                    <View style={styles.commentInputContainer}>
                        <View style={{ flex: 1 }}>
                            {renderStars(item.id)}
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Agrega un comentario..."
                                placeholderTextColor="#9ca3af"
                                value={commentInputs[item.id] || ''}
                                onChangeText={(text) => updateCommentInput(item.id, text)}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.commentButton,
                                submittingComments[item.id] && styles.commentButtonDisabled
                            ]}
                            onPress={() => handleCommentSubmit(item.id)}
                            disabled={submittingComments[item.id] || !commentInputs[item.id]?.trim()}
                        >
                            {submittingComments[item.id] ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={16} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando objetos...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
                {!session && (
                    <TouchableOpacity 
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Objetos Culturales</Text>
            {objetos.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <Text style={styles.noObjectsText}>No se encontraron objetos.</Text>
                </View>
            ) : (
                <FlatList
                    data={objetos}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: COLORS.primary,
    },
    listContainer: {
        paddingBottom: 16,
    },
    publicationCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    publicationImage: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f1f5f9',
    },
    publicationInfo: {
        padding: 14,
    },
    publicationName: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 6,
        color: COLORS.primary,
    },
    publicationDescription: {
        fontSize: 15,
        color: '#334155',
    },
    objectCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    objectImage: {
        width: 80,
        height: 80,
        backgroundColor: '#f1f5f9',
    },
    objectInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    objectName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    objectDescription: {
        fontSize: 14,
        color: '#64748b',
    },
    noImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748b',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    noObjectsText: {
        fontSize: 16,
        color: '#64748b',
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 12,
        paddingHorizontal: 2,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        backgroundColor: 'white',
        fontSize: 14,
        maxHeight: 80,
        textAlignVertical: 'top',
        marginTop: 4,
    },
    commentButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
    },
    commentButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    starsContainer: {
        marginBottom: 8,
    },
    ratingLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});