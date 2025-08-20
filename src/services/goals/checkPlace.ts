import Api from "@services/api";

export async function checkPlace(
  museumId: number,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const api = await Api.getInstance();
  const response = await api.get<void, boolean>({
    url: `/goals/check/${museumId}?latitude=${latitude}&longitude=${longitude}`,
  });
  return response.data;
}
