import Api from "@services/api";
import { PagedResponse } from "@interfaces/common/PagedResponse";
import { ReviewResponseDto } from "@interfaces/reviews/ReviewResponse";

export async function getReviewsByCulturalObject(
    culturalObjectId: number,
    pagina = 0,
    tamano = 6
): Promise<PagedResponse<ReviewResponseDto>> {
    try {
        const api = await Api.getInstance();
        const response = await api.get<void, PagedResponse<ReviewResponseDto>>({
            url: `/reviews/cultural-objects/${culturalObjectId}`,
            params: { pagina, tamano }
        });
        
        console.log(`Reviews for cultural object ${culturalObjectId}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching reviews for cultural object ${culturalObjectId}:`, error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Token inválido, limpiando autenticación...');
            const api = await Api.getInstance();
            api.authorization = null;
        }
        
        throw error;
    }
}
