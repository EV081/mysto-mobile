import Api from "@services/api";
import type { GemmaReply } from "./getMuseumHistory";

/**
 * POST /gemma/museum-quiz/{goalId}
 * Requiere Authorization (hasRole('CUSTOMER')) y devuelve { reply }
 */
export async function generateMuseumQuiz(goalId: number) {
  const api = await Api.getInstance();
  try {
    const response = await api.post<null, GemmaReply>(
      null,
      { url: `/gemma/museum-quiz/${goalId}` }
    );
    return response; // { reply: string }
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // token inválido o sin permisos
      api.authorization = null;
    }
    throw error;
  }
}
