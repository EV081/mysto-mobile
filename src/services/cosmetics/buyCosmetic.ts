import Api from "@services/api";

export async function buyCosmetic(cosmeticId: number) {
  const api = await Api.getInstance();
  await api.post({}, { url: `/cosmetics/buy/${cosmeticId}` });
}