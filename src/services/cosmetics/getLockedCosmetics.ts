import Api from "@services/api";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";
import { PagedResponse } from "@interfaces/common/PagedResponse";

export async function getLockedCosmetics(pagina = 0, tamano = 6): Promise<PagedResponse<Cosmetic>> {
  const api = await Api.getInstance();
  const res = await api.get<void, PagedResponse<Cosmetic>>({ url: `/cosmetics/locked`, params: { pagina, tamano } });
  return res.data;
}