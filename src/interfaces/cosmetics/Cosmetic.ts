import { CosmeticType } from "./CosmeticType";

export interface Cosmetic {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  type: CosmeticType;
}