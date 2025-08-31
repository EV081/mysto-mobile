import { ReviewRequestDto } from "@interfaces/reviews/ReviewRequest";
import Api from "@services/api";

export async function createReviewPost(
  postId: number,
  reviewData: ReviewRequestDto
): Promise<number> {
  const content = (reviewData.content ?? "").trim();
  const rating = reviewData.rating;

  if (!content) throw new Error("El comentario no puede estar vacío.");
  if (content.length < 10)
    throw new Error("El comentario debe tener al menos 10 caracteres.");
  if (typeof rating !== "number" || rating < 1 || rating > 5)
    throw new Error("La calificación debe estar entre 1 y 5.");

  const cleanedData: ReviewRequestDto = { content, rating };

  const api = await Api.getInstance();

  const url = `/reviews/post/${postId}`;
  console.log("POST", url);
  console.log("Body:", JSON.stringify(cleanedData));

  try {
    const response = await api.post<ReviewRequestDto, number>(cleanedData, { url });

    console.log("Review creada con ID:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error creando review:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400) {
      if (data?.message?.includes("Validation failed"))
        throw new Error(
          "El comentario no cumple con los requisitos de validación. Asegúrate de que tenga al menos 10 caracteres y sea apropiado."
        );
      if (data?.error?.includes("ofensivo") || data?.error?.includes("inapropiado"))
        throw new Error(
          "El comentario parece ofensivo o inapropiado. Por favor, modifícalo antes de enviar."
        );
      if (data?.error?.includes("vacío"))
        throw new Error("El comentario no puede estar vacío.");
    }

    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al crear el comentario. Inténtalo de nuevo.");
  }
}
