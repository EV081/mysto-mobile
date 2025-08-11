import Api from "@services/api";
import { PicturesResponse as Picture } from '@interfaces/Pictures/PicturesResponse';

export async function getMuseumPictures(museumId: number): Promise<Picture[]> {
  const api = await Api.getInstance();
  const response = await api.get<void, Picture[]>({
    url: `/pictures/museum?museumId=${museumId}`
  });
  return response.data;
}