import Api from "@services/api";
import { MuseumRequest } from "@interfaces/museum/MuseumRequest";
import { MuseumResponse } from "@interfaces/museum/MuseumResponse";

export async function putUpdateMuseum(id: number, museum: MuseumRequest): Promise<MuseumResponse> {
  const api = await Api.getInstance();
  const response = await api.put<MuseumRequest, MuseumResponse>(museum, {
    url: `/museum/${id}`
  });
  return response.data;
}
