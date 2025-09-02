import Api from "@services/api";
import { CulturalObjectType } from "@interfaces/cuturalObject/CulturalObjectType";

export interface ImageSearchResult {
  id: number;
  name: string; 
  description: string; 
  similarity_score: number; 
  url_image?: string;
  type?: CulturalObjectType; 
}

export interface ImageSearchResponse {
  object: ImageSearchResult;
  similarity_score: number;
}

const mapTypeToEnum = (typeNumber?: number): CulturalObjectType | undefined => {
  switch (typeNumber) {
    case 1: return CulturalObjectType.CERAMICS;
    case 2: return CulturalObjectType.PAINTING;
    case 3: return CulturalObjectType.TEXTILES;
    case 4: return CulturalObjectType.GOLDSMITHING;
    default: return undefined;
  }
};

export async function getObjectbyImage(
  objectId: number,
  imageUri: string, 
  similarityThreshold: number = 0.5
): Promise<ImageSearchResponse> {
  console.log('[getObjectbyImage] Iniciando búsqueda:', { objectId, imageUri, similarityThreshold });
  
  const api = await Api.getImageRecognitionInstance();
  
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as any);
  
  console.log('[getObjectbyImage] Enviando FormData al endpoint:', `/objetos/buscar/${objectId}?similarity_threshold=${similarityThreshold}`);
  
  try {
    const response = await api.postFormData<ImageSearchResponse>(formData, {
      url: `/objetos/buscar/${objectId}?similarity_threshold=${similarityThreshold}`
    });
    
    console.log('[getObjectbyImage] Respuesta exitosa:', JSON.stringify(response.data, null, 2));
    
    // Mapear el tipo del objeto (el backend devuelve un número, lo mantenemos como número)
    // El mapeo a enum se puede hacer en el componente si es necesario
    
    return response.data;
  } catch (error: any) {
    console.error('[getObjectbyImage] Error en la búsqueda:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Re-lanzar el error para que sea manejado por el componente
    throw error;
  }
}