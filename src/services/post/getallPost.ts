
import Api from "@services/api";
import { PostResponseDto } from "@interfaces/Post/PostResponseDto";
import { PagedResponse } from "@interfaces/common/PagedResponse";

export async function getAllPosts(
  pagina = 0,
  tamano = 6,
  basePath = "/post"
): Promise<PagedResponse<PostResponseDto>> {
  const api = await Api.getInstance();
  const url = `${basePath}`;
  console.log("GET", url, { pagina, tamano });

  try {
    const response = await api.get({ url, params: { pagina, tamano } })

    return response.data as PagedResponse<PostResponseDto>;
  } catch (error: any) {
    console.error("Error listando posts:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400) {
      throw new Error("Parámetros de paginación inválidos.");
    }
    if (status === 401 || status === 403) {
      throw new Error("No tienes permisos para ver los posts.");
    }
    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al obtener la lista de posts. Inténtalo de nuevo.");
  }
}
