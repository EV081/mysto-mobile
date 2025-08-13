import { CulturalObjectRequest } from "@interfaces/cuturalObject/CulturalObjectRequest";
import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";
import Api from "@services/api";

export async function updateCulturalObject(
  objectId: number, 
  culturalObject: CulturalObjectRequest
): Promise<CulturalObjectResponse> {
  const api = await Api.getInstance();
  const response = await api.put<CulturalObjectRequest, CulturalObjectResponse>(
    culturalObject, 
    { url: `/cultural-objects/${objectId}` }
  );
  return response.data;
} 