export interface MuseumRequest {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    openTime: string;
    closeTime: string;
    pictures?: string[];
}