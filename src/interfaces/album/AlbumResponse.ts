export interface AlbumStatsDto {
  obtained: number;
  total: number;
  percentage: number;
}

export interface AlbumResponseDto {
  id: number;
  name: string;
  description: string;
  type: string;
  pictureUrls: string[];
  isObtained: boolean; 
}

export interface CompleteAlbumResponse {
  contents: AlbumResponseDto[];
  stats: AlbumStatsDto; 
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
