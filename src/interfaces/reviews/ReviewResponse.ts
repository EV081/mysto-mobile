export interface ReviewResponseDto {
    id: number;
    content: string;
    rating: number;
    userId: number;
    culturalObjectId: number;
    createdAt: string;
    userName?: string; // Optional if the backend includes user name
}
