import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function uploadPostPictures(
  postId: number,
  imageUris: string | string[]   
): Promise<void> {
  // Convertir a array si es un solo URI
  const uris = Array.isArray(imageUris) ? imageUris : [imageUris];
  
  if (uris.length === 0) {
    console.warn('No hay URIs de imagen para subir');
    return;
  }

  const formData = new FormData();

  uris.forEach((uri, idx) => {
    if (!uri) {
      console.warn(`URI de imagen ${idx} está vacío, saltando...`);
      return;
    }

    const imageFile = {
      uri,
      type: "image/jpeg",
      name: `image_${idx}.jpg`,
    } as any;

    formData.append("files", imageFile);
  });

  try {
    const token = await AsyncStorage.getItem("token");
    const basePath = process.env.EXPO_PUBLIC_API_BASE_URL;

    const headers: any = {
      "Content-Type": "multipart/form-data",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    await axios.post(
      `${basePath}/pictures/post/${postId}`,
      formData,
      { headers }
    );
  } catch (error) {
    console.error("Error en uploadPostPictures:", error);
    throw error;
  }
}
