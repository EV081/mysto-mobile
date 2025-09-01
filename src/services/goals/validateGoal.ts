import Api from "@services/api";

export async function validateGoal(
  idGoal: number,
  idImg: number
): Promise<string> {
  const api = await Api.getInstance();

  const response = await api.post<null, string>(
    null,
    {
      url: `/goals/${idGoal}/validate/${idImg}`,
    }
  );

  return response.data;
}