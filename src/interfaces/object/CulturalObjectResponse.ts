export interface CulturalObjectResponseDto {
  id: number;
  name: string;
  reward: string;
  description: string;
  qualification: number;
  type: CulturalObjectType;
  pictureUrls: string[];
  reviewIds: number[];
  museumId: number;
  museumName: string;
}

export enum CulturalObjectType {
  CERAMICS = 'CERAMICS',
  TEXTILES = 'TEXTILES',
  PAINTING = 'PAINTING',
  GOLDSMITHING = 'GOLDSMITHING'
}

