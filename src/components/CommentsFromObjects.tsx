import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ReviewResponseDto } from '@interfaces/reviews/ReviewResponse';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/colors';
import { useState } from 'react';

interface CommentsFromObjectsProps {
    reviews: ReviewResponseDto[];
    loading: boolean;
    objectId: number;
}

export default function CommentsFromObjects({ reviews, loading, objectId }: CommentsFromObjectsProps) {
    console.log(`CommentsFromObjects - objectId: ${objectId}, loading: ${loading}, reviews:`, reviews);
    const [cantComentMostrar, setCantComentMostrar] = useState(3);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando comentarios...</Text>
            </View>
        );
    }

    if (!reviews || reviews.length === 0) {
        return (
            <Text style={styles.noCommentsText}>Sin comentarios.</Text>
        );
    }

    const handleMoreComments = () => {
        if (cantComentMostrar < reviews.length) {
            setCantComentMostrar(cantComentMostrar + 4);
        }
        if (cantComentMostrar >= reviews.length) {
            setCantComentMostrar(reviews.length);
        }
    };

    return (
        <View>
            {reviews.slice(0, cantComentMostrar).map((review, idx) => (
            <View key={review.id} style={styles.commentItem}>
                <Text style={styles.commentText} numberOfLines={2} ellipsizeMode="tail">
                • {review.content}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 12 }}>
                    Por: {review.userName ?? 'Usuario anónimo'}
                </Text>
                <View style={styles.commentMeta}>
                <View style={styles.starsContainer}>
                    {[...Array(5)].map((_, starIdx) => (
                    <Ionicons
                        key={starIdx}
                        name={starIdx < review.rating ? 'star' : 'star-outline'}
                        size={12}
                        color={starIdx < review.rating ? '#fbbf24' : '#d1d5db'}
                    />
                    ))}
                </View>
                <Text style={styles.commentDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                </Text>
                </View>
            </View>
            ))}
            {reviews.length > 3 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Text
                style={styles.moreCommentsText}
                onPress={handleMoreComments}
                >
                ...y {reviews.length - cantComentMostrar} comentarios más
                </Text>
                <Text style={[styles.moreCommentsText, { marginLeft: 120 }]}>
                <Text
                    style={[styles.moreCommentsText, { marginLeft: 120 }]}
                    onPress={() => setCantComentMostrar(3)}
                >
                    ocultar
                </Text>
                </Text>
            </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    loadingText: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 8,
    },
    noCommentsText: {
        fontSize: 13,
        color: '#64748b',
    },
    commentItem: {
        marginBottom: 4,
    },
    commentText: {
        fontSize: 13,
        color: '#334155',
        marginBottom: 1,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    commentDate: {
        fontSize: 11,
        color: '#9ca3af',
    },
    moreCommentsText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
});
