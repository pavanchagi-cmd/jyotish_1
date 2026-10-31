import { norm360 } from "./math";

/**
 * Navamsa (D9) sign for a sidereal longitude.
 * Classical rule (BPHS ch. 6): movable signs start their 9 navamsas from the
 * sign itself, fixed signs from the 9th sign, dual signs from the 5th. This is
 * equivalent to counting 3°20′ steps continuously from 0° Aries, mod 12.
 */
export function navamsaSign(longitude: number): number {
  return Math.floor(norm360(longitude) / (30 / 9)) % 12;
}
