import Api from "@services/api";

export async function deleteCulturalObject(objectId: number): Promise<void> {
  const api = await Api.getInstance();
  await api.delete({ url: `/cultural-objects/${objectId}` });
} 