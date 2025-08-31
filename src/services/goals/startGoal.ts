import Api from "@services/api";

export async function startGoals(
  museumId: number,
  latitude: number,
  longitude: number
): Promise<void> {
  const api = await Api.getInstance();
  await api.post<undefined, void>(
    undefined,
    { url: `/goals/start/${museumId}`, params: { latitude, longitude } }
  );
  // opcional: verifica status==201 dentro de tu wrapper Api
}




