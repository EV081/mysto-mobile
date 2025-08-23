import Api from "@services/api"
import { PagedResponse } from "@interfaces/common/PagedResponse";
import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";

export async function getListAllObjects(pagina = 0, tamano = 10): Promise<PagedResponse<CulturalObjectResponse>> {
  const api = await Api.getInstance();
  const response = await api.get<void, PagedResponse<CulturalObjectResponse>>(
    { url: `/cultural-objects`,
      params: {pagina,tamano}
    }
  );
  return response.data;
}