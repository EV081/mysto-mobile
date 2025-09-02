export interface PostResponseDto {
  id: number;
  content: string;
  likes: number;
  createdAt: string;
  pictureUrls: string[];
  reviewIds: number[];
  userId: number;
  userName: string;      
  museumId: number;
  museumName: string; 
  userImageUrl?: string;
}
