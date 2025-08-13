import { ArticleResponse } from "@interfaces/article/ArticleResponse";
import { PaginatedResponse } from "@interfaces/globals/PaginatedResponse";
import Api from "@services/api"

export const getAllArticles = async (page:number, size: number) => {
    const api = await Api.getInstance();
    try {
        const response = await api.get<undefined, PaginatedResponse<ArticleResponse>>({ url: "/article", params: { page, size } });
        return response.data;
    } catch (error) {
        console.error("Fetching articles failed:", error);
        throw error;
    }
}