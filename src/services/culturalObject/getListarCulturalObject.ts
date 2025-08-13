import Api from "@services/api";
import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";
import { PagedResponse } from "@interfaces/common/PagedResponse";

export async function getPagedMuseums(id: number, pagina = 0, tamano = 6): Promise<PagedResponse<CulturalObjectResponse>> {
  const api = await Api.getInstance();
  const response = await api.get<void, PagedResponse<CulturalObjectResponse>>({
    url: `/cultural-objects/museum/${id}`,
    params: { pagina, tamano }
  });
  return response.data;
}
