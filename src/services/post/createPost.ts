import Api from "@services/api";
import { PostDto } from "@interfaces/Post/PostDto";
import { PostResponseDto } from "@interfaces/Post/PostResponseDto";

export async function createPost(
  parentId: number,
  postData: PostDto,
  basePath: string = "/post"
): Promise<PostResponseDto> {
  const api = await Api.getInstance();

  const content = (postData.content ?? "").trim();
  if (!content) throw new Error("El texto del post no puede estar vacío.");
  if (content.length < 5) {
    throw new Error("El post debe tener al menos 5 caracteres.");
  }

  const cleanedData: PostDto = { ...postData, content };

  const url = `${basePath}/${parentId}`;
  console.log("POST", url);
  console.log("Body:", JSON.stringify(cleanedData));

  try {
    const response = await api.post<PostDto, PostResponseDto>(cleanedData, { url });

    console.log("Post creado:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error creando post:", error);
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400) {
      if (data?.error?.includes("vacío"))
        throw new Error("El texto del post no puede estar vacío.");
      if (data?.error?.includes("ofensivo") || data?.error?.includes("inapropiado"))
        throw new Error(
          "El post parece ofensivo o inapropiado. Por favor, modifícalo antes de enviar."
        );
      if (data?.message?.includes("Validation failed"))
        throw new Error(
          "El post no cumple con los requisitos de validación. Revisa el contenido."
        );
    }

    if (status === 403 || status === 401) {
      throw new Error("No tienes permisos para crear este post.");
    }

    if (data?.error) throw new Error(data.error);
    if (data?.message) throw new Error(data.message);

    throw new Error("Error al crear el post. Inténtalo de nuevo.");
  }
}