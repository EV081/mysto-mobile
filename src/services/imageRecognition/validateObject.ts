import Api from "@services/api";
import { CulturalObjectType } from "@interfaces/cuturalObject/CulturalObjectType";

export interface ValidateObjectResponse {
  object: {
    id: number;
    name: string;
    description: string;
    url_image: string;
    type: CulturalObjectType;
  };
  similarity_score: number;
}

// Respuesta RAW del backend (type numérico)
interface RawValidateObjectResponse {
  object: {
    id: number;
    name: string;
    description: string;
    url_image: string;
    type: number; // <-- el backend envía número
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

export async function validateObject(
  targetId: number,
  imageUri: string,
  similarityThreshold: number = 0.7
): Promise<ValidateObjectResponse> {
  console.log('Validando objeto:', { targetId, imageUri, similarityThreshold });
  
  const api = await Api.getImageRecognitionInstance();
  
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as any);
  
  // 👇 Usamos el tipo RAW aquí
  const response = await api.postFormData<RawValidateObjectResponse>(formData, {
    url: `/objetos/validar/${targetId}?similarity_threshold=${similarityThreshold}`
  });
  
  console.log('Respuesta de validación:', JSON.stringify(response.data, null, 2));
  
  const raw = response.data;

  // Mapeo a tu interfaz pública con enum
  return {
    similarity_score: raw.similarity_score,
    object: {
      id: raw.object.id,
      name: raw.object.name,
      description: raw.object.description,
      url_image: raw.object.url_image,
      type: mapTypeToEnum(raw.object.type) ?? CulturalObjectType.CERAMICS,
    }
  };
}
