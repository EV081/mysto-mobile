import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { getListAllObjects } from '@services/museum/getListAllObjects';
import { getCulturalObjectInfo } from '@services/culturalObject/getCulturalObjectInfo';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthState } from '../hooks/useAuth';
import { COLORS } from '@constants/colors';
import { createReviewCulturalObject } from '@services/reviews/createReviewCulturalObject';
import { getReviewsByCulturalObject } from '@services/reviews/getReviewsByCulturalObject';
import { ReviewResponseDto } from '@interfaces/reviews/ReviewResponse';
import CommentsFromObjects from './CommentsFromObjects';
import StarReviews from './StarReviews';

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
            const data = await getListAllObjects(0, 10);
            setObjetos(data.contents || []);
            setError(null);

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
            console.log(`Reviews for object ${culturalObjectId}:`, reviewsData);
            setReviews(prev => ({ ...prev, [culturalObjectId]: reviewsData.contents || [] }));
        } catch (error) {
            console.error(`Error fetching reviews for object ${culturalObjectId}:`, error);
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
        const rating = ratings[culturalObjectId] || 5;
        
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
            
            setCommentInputs(prev => ({ ...prev, [culturalObjectId]: '' }));
            setRatings(prev => ({ ...prev, [culturalObjectId]: 5 }));
            
            // Refresh reviews
            await fetchReviewsForObject(culturalObjectId);
            
            // Refresh the cultural object to get updated rating
            await refreshObjectData(culturalObjectId);
            
            Alert.alert('Éxito', 'Comentario y calificación agregados correctamente');
        } catch (error: any) {
            console.error('Error submitting comment:', error);
            Alert.alert('Error', error.message || 'No se pudo agregar el comentario');
        } finally {
            setSubmittingComments(prev => ({ ...prev, [culturalObjectId]: false }));
        }
    };

    const refreshObjectData = async (culturalObjectId: number) => {
        try {
            const response = await getCulturalObjectInfo(culturalObjectId);
            const updatedObject = response.data;
            setObjetos(prev => 
                prev.map(obj => 
                    obj.id === culturalObjectId ? updatedObject : obj
                )
            );
        } catch (error) {
            console.error('Error refreshing object data:', error);
            // Fallback: just refresh all objects
            await fetchData();
        }
    };

    const updateCommentInput = (culturalObjectId: number, text: string) => {
        setCommentInputs(prev => ({ ...prev, [culturalObjectId]: text }));
    };

    const updateRating = (culturalObjectId: number, rating: number) => {
        setRatings(prev => ({ ...prev, [culturalObjectId]: rating }));
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
                    <Text style={{ fontSize: 14, color: '#000000', marginTop: 2 }}>
                        <Text style={{ fontWeight: 'bold' }}>Calificación:</Text> {item.qualification?.toFixed(2)} / 5
                    </Text>
                </View>
                <View style={{
                    backgroundColor: COLORS.background,
                    borderRadius: 8,
                    borderColor: COLORS.black,
                    padding: 10,
                    marginTop: 14,
                }}>
                    <Text style={{ fontWeight: 'bold', color: '#684300ff', marginBottom: 4 }}>Comentarios:</Text>
                    <CommentsFromObjects 
                        reviews={reviews[item.id] || []}
                        loading={loadingReviews[item.id] || false}
                        objectId={item.id}
                    />
                </View>
                
                {session && (
                    <View style={styles.commentInputContainer}>
                        <StarReviews
                            objectId={item.id}
                            commentInput={commentInputs[item.id] || ''}
                            rating={ratings[item.id] || 5}
                            submitting={submittingComments[item.id] || false}
                            onCommentChange={(text) => updateCommentInput(item.id, text)}
                            onRatingChange={(rating) => updateRating(item.id, rating)}
                            onCommentSubmit={() => handleCommentSubmit(item.id)}
                        />
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
        backgroundColor: COLORS.background,
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
        borderColor: COLORS.black, 
        borderWidth: 1,   
    },
    publicationImage: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: COLORS.background,
    },
    publicationInfo: {
        padding: 14,
    },
    publicationName: {
        fontSize: 22,
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
});