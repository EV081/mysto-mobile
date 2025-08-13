import { CulturalObjectType } from "@interfaces/cuturalObject/CulturalObjectType";

export interface CulturalObjectResponse {
    id: number;
    name: string;
    points: number;
    coins: number;
    description: string;
    qualification: number;
    type: CulturalObjectType;
    pictureUrls: string[];
    reviews: string[];
    museumId: number;
    museumName: string;
}