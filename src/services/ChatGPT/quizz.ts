import Api from "@services/api";

export async function generateMuseumQuiz(goalId: number) {
  try {
    const api = await Api.getInstance();
    const response = await api.post<void, { reply: string }>(
      undefined,
      { url: `/gpt/museum-quiz/${goalId}` }
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