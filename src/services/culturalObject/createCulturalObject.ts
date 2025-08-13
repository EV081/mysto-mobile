import { CulturalObjectRequest } from "@interfaces/cuturalObject/CulturalObjectRequest";
import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";
import Api from "@services/api";

export async function createCulturalObject(culturalObject: CulturalObjectRequest, museumId: number): Promise<CulturalObjectResponse> {
  const api = await Api.getInstance();
  const response = await api.post<CulturalObjectRequest, CulturalObjectResponse>(
    culturalObject, { url: `/cultural-objects?museumId=${museumId}` },
  );
  return response.data;
}
