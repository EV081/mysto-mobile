import Api from "@services/api";

export async function checkPlace(
  museumId: number,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const api = await Api.getInstance();
  const res = await api.get<void, boolean>({
    url: `/goals/check/${museumId}`,
    params: { latitude, longitude },
  });
  return res.data;
}
