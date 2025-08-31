import { ReviewRequestDto } from "@interfaces/reviews/ReviewRequest";
import Api from "@services/api";

export async function updateReview(
  reviewId: number,
  reviewData: ReviewRequestDto
): Promise<void> {
  const content = (reviewData.content ?? "").trim();
  const rating = reviewData.rating;

  if (!content) throw new Error("El comentario no puede estar vacío.");
  if (content.length < 10)
    throw new Error("El comentario debe tener al menos 10 caracteres.");
  if (typeof rating !== "number" || rating < 1 || rating > 5)
    throw new Error("La calificación debe estar entre 1 y 5.");

  const cleanedData: ReviewRequestDto = { content, rating };

  const api = await Api.getInstance();
  const url = `/reviews/${reviewId}`;
  console.log("PUT", url);
  console.log("Body:", JSON.stringify(cleanedData));

  try {
    await api.put(cleanedData, { url });

    console.log(`Review ${reviewId} actualizada correctamente.`);
  } catch (error: any) {
    console.error("Error actualizando review:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400) {
      if (data?.message?.includes("Validation failed"))
        throw new Error(
          "La review no cumple con los requisitos de validación. Revisa el contenido y la calificación."
        );
      if (data?.error?.includes("ofensivo") || data?.error?.includes("inapropiado"))
        throw new Error(
          "El comentario parece ofensivo o inapropiado. Por favor, modifícalo antes de enviar."
        );
      if (data?.error?.includes("vacío"))
        throw new Error("El comentario no puede estar vacío.");
    }

    if (status === 403 || status === 401)
      throw new Error("No tienes permisos para editar esta reseña.");

    if (status === 404)
      throw new Error("La reseña no existe o ya fue eliminada.");

    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al actualizar la reseña. Inténtalo de nuevo.");
  }
}
