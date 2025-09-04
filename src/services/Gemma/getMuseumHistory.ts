import Api from "@services/api";

export type GemmaReply = { reply: string };

/**
 * POST /gemma/museum-history/{goalId}
 * Requiere Authorization y devuelve { reply }
 */
export async function getMuseumHistory(goalId: number): Promise<GemmaReply> {
  if (!Number.isFinite(goalId)) {
    throw new Error(`goalId inválido: ${goalId}`);
  }
  const api = await Api.getInstance();
  try {
    const res = await api.post<null, GemmaReply>(
      null,
      { url: `/gemma/museum-history/${goalId}` }
    );
    return res.data; // <- SIEMPRE devolvemos el body plano
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      api.authorization = null;
    }
    throw error;
  }
}
