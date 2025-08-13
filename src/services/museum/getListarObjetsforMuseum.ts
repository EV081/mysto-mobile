import Api from "@services/api";
import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";

export async function getObjectsByMuseumId(museumId: number): Promise<CulturalObjectResponse[]> {
  const api = await Api.getInstance();

  const response = await api.get<void, CulturalObjectResponse[]>({
    url: `/museum/${museumId}/objetos`
  });

  return response.data;
}
