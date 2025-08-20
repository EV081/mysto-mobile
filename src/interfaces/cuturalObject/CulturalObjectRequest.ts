import { CulturalObjectType } from "./CulturalObjectType";

export interface CulturalObjectRequest {
    name: string;
    points: number;
    coins: number;
    description: string;
    type: CulturalObjectType;
    pictures?: string[];
}