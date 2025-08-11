import Api from "@services/api";
import { PicturesResponse as Picture } from '@interfaces/Pictures/PicturesResponse';

export async function getCulturalObjectPictures(culturalObjectId: number): Promise<Picture[]> {
    const api = await Api.getInstance();
    const response = await api.get<void, Picture[]>({
        url: `/pictures/cultural-object?culturalObjectId=${culturalObjectId}`
    });
    return response.data;
}