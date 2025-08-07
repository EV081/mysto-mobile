import Api from "@services/api";

export async function getCulturaObjectPictures(culturalObjectId: string): Promise<string[]> {
    const api = await Api.getInstance();
    const response = await api.get<void, string[]>({
        url: `/pictures/cultural-object?culturalObjectId=${culturalObjectId}`
    });
    return response.data;
}