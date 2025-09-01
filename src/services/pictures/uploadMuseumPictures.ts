import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function uploadMuseumPictures(
  museumId: number,
  imageUris: string[]    // ahora acepta varias
): Promise<void> {
  if (!imageUris?.length) return;

  const formData = new FormData();
  imageUris.forEach((uri, idx) => {
    formData.append("files", {
      uri,
      type: "image/jpeg",
      name: `museum_${museumId}_${idx}.jpg`,
    } as any);
  });

  const token = await AsyncStorage.getItem("token");
  const basePath = process.env.EXPO_PUBLIC_API_BASE_URL;

  await axios.post(`${basePath}/pictures/museum/${museumId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 60_000,
  });
}
