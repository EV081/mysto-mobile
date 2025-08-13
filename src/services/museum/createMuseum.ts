import { MuseumRequest} from "@interfaces/museum/MuseumRequest";
import { MuseumResponse } from "@interfaces/museum/MuseumResponse";
import Api from "@services/api";

export async function createMuseum(museum: MuseumRequest) : Promise<MuseumResponse>{
  console.log('Enviando datos del museo:', JSON.stringify(museum, null, 2));
  
  const api = await Api.getInstance();
  const response = await api.post<MuseumRequest, MuseumResponse>(museum, {
    url: "/museum"
  });
  
  console.log('Respuesta del servidor:', JSON.stringify(response.data, null, 2));
  return response.data;
} 