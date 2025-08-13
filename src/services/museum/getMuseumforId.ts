import Api from "@services/api";
import { MuseumResponse } from "@interfaces/museum/MuseumResponse";

export async function getMuseumForId(id: number){
  const api = await Api.getInstance();
  const response = await api.get<void, MuseumResponse>({
    url: `/museum/${id}`
  });
  return response;
}