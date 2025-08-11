export interface MuseumResponse {
    id: number
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    openTime: string;
    closeTime: string;
    pictureUrls: string[];
}