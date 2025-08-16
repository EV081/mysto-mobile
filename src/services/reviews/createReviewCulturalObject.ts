import { ReviewRequestDto } from "@interfaces/reviews/ReviewRequest";
import Api from "@services/api";

export async function createReviewCulturalObject(
    culturalObjectId: number, 
    reviewData: ReviewRequestDto
): Promise<number> {
    try {
        const api = await Api.getInstance();
        
        // Ensure the content is properly trimmed and not empty
        const cleanedData: ReviewRequestDto = {
            content: reviewData.content.trim(),
            rating: reviewData.rating
        };
        
        console.log('Making API request to:', `/reviews`);
        console.log('Request body:', JSON.stringify(cleanedData));
        console.log('Content length:', cleanedData.content.length);
        console.log('Rating:', cleanedData.rating);
        
        const response = await api.post<ReviewRequestDto, number>(
            cleanedData,
            { 
                url: `/reviews`,
                params: {
                    culturalObjectId: culturalObjectId
                }
            }
        );
        
        console.log('Review created successfully with ID:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error creating review:', error);
        console.error('Error details:', error.response?.data);
        
        // Handle specific backend validation errors
        if (error.response?.status === 400) {
            const errorData = error.response.data;
            if (errorData.message && errorData.message.includes('Validation failed')) {
                throw new Error('El comentario no cumple con los requisitos de validación. Asegúrate de que tenga al menos 10 caracteres y sea apropiado.');
            }
            if (errorData.error && errorData.error.includes('agresivo o inapropiado')) {
                throw new Error('El comentario parece agresivo o inapropiado. Por favor, modifícalo antes de enviar.');
            }
            if (errorData.error && errorData.error.includes('vacío')) {
                throw new Error('El comentario no puede estar vacío.');
            }
        }
        
        // Handle specific error messages from backend
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        
        throw new Error('Error al crear el comentario. Inténtalo de nuevo.');
    }
}
