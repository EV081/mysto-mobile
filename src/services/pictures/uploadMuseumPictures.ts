import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function uploadMuseumPictures(museumId: number, imageUri: string): Promise<void> {
    const formData = new FormData();
    
    // Crear un objeto File-like para React Native
    const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
    } as any;
    
    formData.append('files', imageFile);
    
    try {
        // Obtener el token del AsyncStorage
        const token = await AsyncStorage.getItem("token");
        const basePath = process.env.EXPO_PUBLIC_API_BASE_URL;
        
        const headers: any = {
            'Content-Type': 'multipart/form-data',
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        await axios.post(`${basePath}/pictures/museum/${museumId}`, formData, {
            headers: headers
        });
    } catch (error) {
        console.error("Error en uploadMuseumPictures:", error);
        throw error;
    }
} 