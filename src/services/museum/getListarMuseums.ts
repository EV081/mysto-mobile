// services/museum/getListarMuseums.ts
import Api from "@services/api";
import { MuseumResponse } from "@interfaces/museum/MuseumResponse";
import { PagedResponse } from "@interfaces/common/PagedResponse";

export async function getPagedMuseums(
  pagina = 0,
  tamano = 6
): Promise<PagedResponse<MuseumResponse>> {
  const doRequest = async () => {
    const api = await Api.getInstance();
    const response = await api.get<void, PagedResponse<MuseumResponse>>({
      url: `/museum`,
      params: { pagina, tamano },
    });
    return response.data;
  };

  try {
    return await doRequest();
  } catch (e: any) {
    const status = e?.response?.status;
    // Reintenta UNA vez si fue 401/403 (token aún no aplicado en el wrapper)
    if (status === 401 || status === 403) {
      // pequeño delay para dar tiempo a que AuthProvider sincronice el token
      await new Promise((r) => setTimeout(r, 150));
      return await doRequest();
    }
    throw e;
  }
}
