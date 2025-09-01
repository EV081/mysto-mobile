import Api from "@services/api";

interface ReviewResponse {
  id: number;
  content: string;
  rating: number;
  likes: number;
  createdAt: string;
  userName?: string;
}

export async function getReviewsByPost(
  postId: number,
  basePath: string = "/reviews"
): Promise<ReviewResponse[]> {
  const api = await Api.getInstance();
  const url = `${basePath}/post/${postId}`;
  console.log("GET", url);

  try {
  const response = await api.get({ url });
  const data: any = response.data;

  if (!data) return [];
  if (Array.isArray(data)) return data as ReviewResponse[];
  if (data.contents && Array.isArray(data.contents)) return data.contents as ReviewResponse[];
  return [];
  } catch (error: any) {
    console.error("Error obteniendo reviews del post:", error);
    return [];
  }
} 