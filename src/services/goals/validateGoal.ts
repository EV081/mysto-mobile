import Api from "@services/api";

export async function validateGoal(
  museumId: number,
  objectId: number
): Promise<string> {
  console.log('[validateGoal] Validando meta:', { museumId, objectId });
  
  const api = await Api.getInstance();
  
  const url = `/goals/${museumId}/validate/${objectId}`;
  console.log('[validateGoal] URL de validación:', url);

  const response = await api.post<null, string>(
    null,
    { url }
  );

  console.log('[validateGoal] Meta validada exitosamente');
  return response.data;
}