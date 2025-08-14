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
  resultados?: ImageSearchResult[]; 
  id?: number;
  name?: string;
  description?: string;
  similarity_score?: number;
  url_image?: string;
  type?: CulturalObjectType;
  mensaje?: string;
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
  imageUri: string, 
  similarityThreshold: number = 0.7
): Promise<ImageSearchResponse | ImageSearchResult[]> {
  console.log('Buscando objeto por imagen:', { imageUri, similarityThreshold });
  
  const api = await Api.getImageRecognitionInstance();
  
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as any);
  
  const response = await api.postFormData<ImageSearchResponse | ImageSearchResult[]>(formData, {
    url: `/objetos/buscar?similarity_threshold=${similarityThreshold}`
  });
  
  console.log('Respuesta de búsqueda por imagen:', JSON.stringify(response.data, null, 2));
  
  const convertObject = (obj: any): ImageSearchResult => ({
    ...obj,
    type: mapTypeToEnum(obj.type)
  });
  
  if (Array.isArray(response.data)) {
    return response.data.map(convertObject);
  } else if (response.data && typeof response.data === 'object') {
    const data = response.data as any;
    if (data.id && data.name) {
      return [convertObject(data)];
    }
    if (data.resultados && Array.isArray(data.resultados)) {
      return {
        ...data,
        resultados: data.resultados.map(convertObject)
      };
    }
  }
  
  return response.data;
}