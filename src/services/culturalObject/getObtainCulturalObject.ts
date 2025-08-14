import { CulturalObjectResponse } from "@interfaces/cuturalObject/CulturalObjectResponse";
import Api from "@services/api";

export interface ObtainCulturalObjectError {
  status: number;
  message: string;
  type: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'SERVER_ERROR' | 'UNKNOWN';
}

export async function obtainCulturalObject(objectId: number): Promise<CulturalObjectResponse> {
  try {
    const api = await Api.getInstance();
    const response = await api.get<void, CulturalObjectResponse>(
      { url: `/cultural-objects/${objectId}` }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al obtener objeto cultural:', error);
    
    const customError: ObtainCulturalObjectError = {
      status: error.response?.status || 0,
      message: '',
      type: 'UNKNOWN'
    };

    // Manejar diferentes códigos de estado
    if (error.response?.status === 404) {
      customError.type = 'NOT_FOUND';
      customError.message = `El objeto cultural con ID ${objectId} no existe`;
    } else if (error.response?.status === 500) {
      customError.type = 'ALREADY_EXISTS';
      customError.message = `El objeto cultural con ID ${objectId} ya existe o hay un conflicto`;
    } else if (error.response?.status >= 500) {
      customError.type = 'SERVER_ERROR';
      customError.message = 'Error interno del servidor al obtener el objeto cultural';
    } else if (error.response?.data?.message || error.response?.data?.mensaje) {
      customError.message = error.response.data.message || error.response.data.mensaje;
    } else if (error.message) {
      customError.message = error.message;
    } else {
      customError.message = `Error desconocido al obtener el objeto cultural con ID ${objectId}`;
    }

    const enhancedError = new Error(customError.message);
    (enhancedError as any).details = customError;
    throw enhancedError;
  }
}