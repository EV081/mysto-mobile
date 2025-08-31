import Api from "@services/api";

export async function startGoals(
  museumId: number,
  latitude: number,
  longitude: number
): Promise<number> {
  const api = await Api.getInstance();

  const response = await api.post<undefined, number>(
    undefined,
    { url: `/goals/start/${museumId}`, params: { latitude, longitude } }
  );

  // tu wrapper devuelve un AxiosResponse, así que extraemos el body:
  return response.data;
}



