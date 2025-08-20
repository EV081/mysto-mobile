import Api from "@services/api";

export async function unequipCosmetic(cosmeticId: number) {
  const api = await Api.getInstance();
  await api.post({}, { url: `/cosmetics/unequip/${cosmeticId}` });
}