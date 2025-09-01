import Api from "@services/api";
import { PicturesResponse as Picture } from '@interfaces/Pictures/PicturesResponse';

export async function getMuseumPictures(postId: number): Promise<Picture[]> {
  const api = await Api.getInstance();
  const response = await api.get<void, Picture[]>({
    url: `/pictures/post?postId=${postId}`
  });
  return response.data;
}