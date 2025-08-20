import Api from "@services/api";

export async function equipCosmetic(cosmeticId: number) {
  const api = await Api.getInstance();
  await api.post({}, { url: `/cosmetics/equip/${cosmeticId}` });
}