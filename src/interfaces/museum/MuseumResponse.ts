export interface MuseumResponse {
    id: number
    name: string;
    description: string;
    latitud: number;
    longitud: number;
    openTime: string;
    closeTime: string;
    pictureUrls: string[];
}