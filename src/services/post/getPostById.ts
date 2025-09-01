import Api from "@services/api";
import { PostResponseDto } from "@interfaces/Post/PostResponseDto";

export async function getPostById(
  postId: number,
  basePath: string = "/post"
): Promise<PostResponseDto> {
  const api = await Api.getInstance();
  const url = `${basePath}/${postId}`;
  console.log("GET", url);

  try {
    const response = await api.get<void, PostResponseDto>({ url });
    return response.data;
  } catch (error: any) {
    console.error("Error obteniendo post:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 404) {
      throw new Error("El post no existe o fue eliminado.");
    }
    if (status === 401 || status === 403) {
      throw new Error("No tienes permisos para ver este post.");
    }
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al obtener el post. Inténtalo de nuevo.");
  }
} 