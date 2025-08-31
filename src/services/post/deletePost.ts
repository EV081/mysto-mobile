import Api from "@services/api";

export async function deletePost(postId: number, basePath = "/post"): Promise<void> {
  const api = await Api.getInstance();
  const url = `${basePath}/${postId}`;
  console.log("DELETE", url);

  try {
    await api.delete({ url }); // sin genéricos
  } catch (error: any) {
    const status = error.response?.status;
    const data = error.response?.data;
    if (status === 404) throw new Error("El post no existe o ya fue eliminado.");
    if (status === 401 || status === 403) throw new Error("No tienes permisos para eliminar este post.");
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);
    throw new Error("Error al eliminar el post. Inténtalo de nuevo.");
  }
}
