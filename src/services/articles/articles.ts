import { ArticleResponse } from "@interfaces/article/ArticleResponse";
import Api from "@services/api";
import { PagedResponse } from "@interfaces/common/PagedResponse";

export async function getAllArticles(page: number, size: number): Promise<PagedResponse<ArticleResponse>> {
  const api = await Api.getInstance();
  const response = await api.get<undefined, PagedResponse<ArticleResponse>>({
    url: "/article",
    params: { page, size },
  });
  return response.data;
}
