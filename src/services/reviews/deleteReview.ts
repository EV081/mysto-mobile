import Api from "@services/api";

export async function deleteReview(reviewId: number): Promise<void> {
  const api = await Api.getInstance();
  const url = `/reviews/${reviewId}`;
  console.log("DELETE", url);

  try {
    await api.delete({ url });

    console.log(`Review con ID ${reviewId} eliminada correctamente.`);
  } catch (error: any) {
    console.error("Error eliminando review:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 403 || status === 401) {
      throw new Error("No tienes permisos para eliminar esta reseña.");
    }
    if (status === 404) {
      throw new Error("La reseña no existe o ya fue eliminada.");
    }
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al eliminar la reseña. Inténtalo de nuevo.");
  }
}
