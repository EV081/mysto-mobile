import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/colors';

interface StarReviewsProps {
    objectId: number;
    commentInput: string;
    rating: number;
    submitting: boolean;
    onCommentChange: (text: string) => void;
    onRatingChange: (rating: number) => void;
    onCommentSubmit: () => void;
}

export default function StarReviews({
    objectId,
    commentInput,
    rating,
    submitting,
    onCommentChange,
    onRatingChange,
    onCommentSubmit
}: StarReviewsProps) {

    const renderStars = () => {
        const stars = [];
        
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => onRatingChange(i)}
                    style={styles.starButton}
                >
                    <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={20}
                        color={i <= rating ? '#fbbf24' : '#d1d5db'}
                    />
                </TouchableOpacity>
            );
        }
        
        return stars;
    };

    return (
        <View style={styles.container}>
            <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Calificación:</Text>
                <View style={styles.starsRow}>
                    {renderStars()}
                </View>
            </View>
            
            <View style={styles.inputSection}>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Agrega un comentario..."
                    placeholderTextColor="#9ca3af"
                    value={commentInput}
                    onChangeText={onCommentChange}
                    multiline
                    numberOfLines={2}
                />
                
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        submitting && styles.submitButtonDisabled
                    ]}
                    onPress={onCommentSubmit}
                    disabled={submitting || !commentInput?.trim()}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={16} color="#ffffffff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ratingSection: {
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
    starButton: {
        marginHorizontal: 2,
    },
    inputSection: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    commentInput: {
        flex: 1,
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
    submitButton: {
        backgroundColor: '#a37c10ff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
    },
    submitButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
});
