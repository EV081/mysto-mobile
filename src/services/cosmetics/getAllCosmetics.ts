import Api from "@services/api";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";

export async function getAllCosmetics(): Promise<Cosmetic[]> {
  const api = await Api.getInstance();
  const res = await api.get<void, Cosmetic[]>({ url: `/cosmetics/all` });
  return res.data;
}