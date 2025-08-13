import {CompleteAlbumResponse } from "@interfaces/album/AlbumResponse";
import Api from "@services/api";

export async function getCompleteAlbum(page: number = 0, size: number = 10) {
  try {
    const api = await Api.getInstance();
    const response = await api.get<void, CompleteAlbumResponse>({
      url: `/album?page=${page}&size=${size}`
    });
    return response;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Token inválido, limpiando autenticación...');
      const api = await Api.getInstance();
      api.authorization = null;
    }
    throw error;
  }
}