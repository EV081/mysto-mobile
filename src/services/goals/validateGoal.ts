import Api from "@services/api";

export async function validateGoal(
  idGoal: number,
  image: File
): Promise<string> {
  const api = await Api.getInstance();

  const formData = new FormData();
  formData.append("file", image);

  const response = await api.post<FormData, string>(
    formData,
    {
      url: `/goals/${idGoal}/validate`,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}