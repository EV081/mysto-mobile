import Api from "@services/api";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";

export async function getEquippedCosmetics(): Promise<{ head?: Cosmetic; body?: Cosmetic; pants?: Cosmetic }> {
  const api = await Api.getInstance();
  const res = await api.get<void, { head?: Cosmetic; body?: Cosmetic; pants?: Cosmetic }>({ url: `/cosmetics/equipped` });
  return res.data;
}