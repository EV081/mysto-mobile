import Api from "@services/api";
import { PostDto } from "@interfaces/Post/PostDto";
import { PostResponseDto } from "@interfaces/Post/PostResponseDto";

export async function updatePost(
  postId: number,
  postData: PostDto,
  basePath = "/post"
): Promise<PostResponseDto> {
  const api = await Api.getInstance();
  const url = `${basePath}/${postId}`;
  console.log("PUT", url, "Body:", postData);

  const content = (postData.content ?? "").trim();
  if (!content) throw new Error("El texto del post no puede estar vacío.");
  if (content.length < 5)
    throw new Error("El post debe tener al menos 5 caracteres.");

  const cleanedData: PostDto = { ...postData, content };

  try {
    const response = await api.put(cleanedData, { url });

    return response.data as PostResponseDto;
  } catch (error: any) {
    console.error("Error actualizando post:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400) {
      if (data?.error?.includes("vacío"))
        throw new Error("El texto del post no puede estar vacío.");
      if (data?.error?.includes("ofensivo") || data?.error?.includes("inapropiado"))
        throw new Error(
          "El contenido parece ofensivo o inapropiado. Modifícalo antes de enviar."
        );
    }
    if (status === 401 || status === 403) {
      throw new Error("No tienes permisos para editar este post.");
    }
    if (status === 404) {
      throw new Error("El post no existe o fue eliminado.");
    }
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al actualizar el post. Inténtalo de nuevo.");
  }
}
