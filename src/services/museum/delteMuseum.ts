import Api from "@services/api";

export async function deleteMuseum(id: number) {
  const api = await Api.getInstance();
  const response = await api.delete({
    url: `/museum/${id}`
  });
  return response;
} 