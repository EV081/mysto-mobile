import Api from "@services/api";
import { MuseumResponse } from "@interfaces/museum/MuseumResponse";
import { PagedResponse } from "@interfaces/common/PagedResponse";

export async function getPagedMuseums(pagina = 0, tamano = 6): Promise<PagedResponse<MuseumResponse>> {
  const api = await Api.getInstance();
  const response = await api.get<void, PagedResponse<MuseumResponse>>({
    url: `/museum`,
    params: { pagina, tamano }
  });
  return response.data;
}
