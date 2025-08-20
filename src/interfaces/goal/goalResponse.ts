export interface GoalResponse {
  id: number;
  found: number[];
  culturalObject: CulturalObjectSummary[];
}

export interface CulturalObjectSummary {
  id: number;
  name: string;
  points: number;
  coins: number;
  description: string;
}
