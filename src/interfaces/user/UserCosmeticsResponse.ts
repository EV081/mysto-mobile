import { Cosmetic } from "../cosmetics/Cosmetic";

export interface UserCosmeticsResponse {
  unlocked: Cosmetic[];
  equipped: {
    head?: Cosmetic;
    body?: Cosmetic;
    pants?: Cosmetic;
  };
}