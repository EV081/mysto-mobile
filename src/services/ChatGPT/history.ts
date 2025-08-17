import Api from "@services/api";

export async function getMuseumHistory(goalId: number) {
  try {
    const api = await Api.getInstance();
    const response = await api.post<void, { reply: string }>(
      undefined,
      { url: `/museum-history/${goalId}` }
    );
    return response;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("Token inválido, limpiando autenticación...");
      const api = await Api.getInstance();
      api.authorization = null;
    }
    throw error;
  }
}