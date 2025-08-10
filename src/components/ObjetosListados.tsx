import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getListAllObjects } from '@services/museum/getListAllObjects';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthState } from '../hooks/useAuth';
import { COLORS } from '@constants/colors';

export default function ObjetosListados() {
    const { session } = useAuthState();
    const [objetos, setObjetos] = useState<CulturalObjectResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const objectId = route?.params?.objectId || 1; // Default to 1 if not provided

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getListAllObjects(0, 10, objectId);
                setObjetos(data.contents || []);
                setError(null);
            } catch (err) {
                console.error('Error al obtener objetos:', err);
                setError('No se pudieron cargar los objetos.');
                setObjetos([]);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch data if user is authenticated
        if (session) {
            fetchData();
        } else {
            setLoading(false);
            setError('Necesitas iniciar sesión para ver los objetos culturales.');
        }
    }, [objectId, session]);

    // Render item for FlatList
    const renderItem = ({ item }: { item: CulturalObjectResponse }) => (
        <View style={styles.publicationCard}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ObjectDetail', { id: item.id })}
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
                {/* Additional info */}
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
                {/* Reviews/Comments Card */}
                <View style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 14,
                }}>
                    <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 }}>Comentarios:</Text>
                    {item.reviews && item.reviews.length > 0 ? (
                        item.reviews.slice(0, 3).map((review, idx) => (
                            <Text key={idx} style={{ fontSize: 13, color: '#334155', marginBottom: 2 }} numberOfLines={2} ellipsizeMode="tail">
                                • {review}
                            </Text>
                        ))
                    ) : (
                        <Text style={{ fontSize: 13, color: '#64748b' }}>Sin comentarios.</Text>
                    )}
                    {item.reviews && item.reviews.length > 3 && (
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            ...y {item.reviews.length - 3} más
                        </Text>
                    )}
                </View>
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
});