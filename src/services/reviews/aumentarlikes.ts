import Api from "@services/api";


export async function likeReview(reviewId: number): Promise<void> {
  const api = await Api.getInstance();
  const url = `/reviews/${reviewId}/like`;
  console.log("PATCH", url);

  try {
    await api.patch({}, { url });

    console.log(`Like agregado a la review ${reviewId}.`);
  } catch (error: any) {
    console.error("Error al dar like:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 403 || status === 401)
      throw new Error("No tienes permisos para dar like a esta reseña.");
    if (status === 404)
      throw new Error("La reseña no existe o ya fue eliminada.");
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al dar like a la reseña. Inténtalo de nuevo.");
  }
}
