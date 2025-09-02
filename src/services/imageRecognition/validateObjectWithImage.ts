import Api from "@services/api";
import { CulturalObjectType } from "@interfaces/cuturalObject/CulturalObjectType";

export interface ValidateObjectWithImageResponse {
  object: {
    id: number;
    name: string;
    description: string;
    url_image: string;
    type: number;
  };
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

export async function validateObjectWithImage(
  targetId: number,
  imageUri: string,
  similarityThreshold: number = 0.7
): Promise<ValidateObjectWithImageResponse> {
  console.log('Validando objeto con imagen:', { targetId, imageUri, similarityThreshold });
  
  const api = await Api.getImageRecognitionInstance();
  
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as any);
  
  const response = await api.postFormData<ValidateObjectWithImageResponse>(formData, {
    url: `/objetos/validar/${targetId}?similarity_threshold=${similarityThreshold}`
  });
  
  console.log('Respuesta de validación con imagen:', JSON.stringify(response.data, null, 2));
  
  return response.data;
}
