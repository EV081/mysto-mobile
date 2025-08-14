import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";
import Api from "@services/api";

export async function getCulturalObjectInfo(objectId: number) {
  try {
    const api = await Api.getInstance();
    const response = await api.get<void, CulturalObjectResponse>({
      url: `/cultural-objects/${objectId}/info`
    });
    return response;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Token inválido, limpiando autenticación...');
      const api = await Api.getInstance();
      api.authorization = null;
    }
    throw error;
  }
}