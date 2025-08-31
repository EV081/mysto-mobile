export interface CulturalObjectSummaryDto {
  id: number;
  name: string;
  points: number;
  coins: number;
  description: string;
}

export interface GoalResponseDto {
  id: number;
  found: number[];
  culturalObject: CulturalObjectSummaryDto[];
}