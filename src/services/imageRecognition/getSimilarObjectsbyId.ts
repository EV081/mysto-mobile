import Api from "@services/api";
import { CulturalObjectType } from "@interfaces/cuturalObject/CulturalObjectType";

export interface SimilarObject {
  id: number;
  name: string;
  description: string;
  url_image: string;
  type: CulturalObjectType | number;
  combined_score: number;
  scores_breakdown: {
    type_score: number;
    description_score: number;
    image_score: number;
  };
}

// Función helper para convertir el número del tipo a enum
const mapTypeToEnum = (typeNumber?: number): CulturalObjectType | undefined => {
  switch (typeNumber) {
    case 1: return CulturalObjectType.CERAMICS;
    case 2: return CulturalObjectType.PAINTING;
    case 3: return CulturalObjectType.TEXTILES;
    case 4: return CulturalObjectType.GOLDSMITHING;
    default: return undefined;
  }
};

export async function getSimilarObjectbyId(
  objectId: number, 
  topK: number = 3
): Promise<SimilarObject[]> {
  console.log('Buscando objetos similares para ID:', { objectId, topK });
  
  const api = await Api.getImageRecognitionInstance();
  
  const response = await api.get<void, SimilarObject[]>({
    url: `/objetos/similares/${objectId}?top_k=${topK}`
  });
  
  console.log('Respuesta de objetos similares:', JSON.stringify(response.data, null, 2));
  
  // Función para convertir un objeto con el type correcto
  const convertObject = (obj: any): SimilarObject => ({
    ...obj,
    type: typeof obj.type === 'number' ? mapTypeToEnum(obj.type) : obj.type
  });
  
  // La respuesta siempre será un array
  return response.data.map(convertObject);
}