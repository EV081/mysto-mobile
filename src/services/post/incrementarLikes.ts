import Api from "@services/api";

export async function likePost(postId: number, basePath = "/post"): Promise<void> {
  const api = await Api.getInstance();
  const url = `${basePath}/${postId}/like`;
  console.log("PATCH", url);

  try {
    await api.patch({}, { url });
    console.log(`Like agregado al post ${postId}.`);
  } catch (error: any) {
    console.error("Error al dar like:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 404) throw new Error("El post no existe o ya fue eliminado.");
    if (status === 401 || status === 403)
      throw new Error("No tienes permisos para dar like a este post.");
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al dar like al post. Inténtalo de nuevo.");
  }
}
