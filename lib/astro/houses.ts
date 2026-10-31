import { signOf } from "./math";
import type { Planet } from "./tables/planets";

/** Whole-sign house (1–12) of a sign counted from the first-house sign. */
export function houseFromSign(sign: number, firstHouseSign: number): number {
  return ((sign - firstHouseSign + 12) % 12) + 1;
}

export interface House {
  house: number;
  sign: number;
  planets: Planet[];
}

/** Whole-sign houses from a reference sign (Lagna for D1, Moon for the Moon chart). */
export function wholeSignHouses(firstHouseSign: number, planetSigns: Record<Planet, number>): House[] {
  return Array.from({ length: 12 }, (_, i) => {
    const sign = (firstHouseSign + i) % 12;
    const planets = (Object.keys(planetSigns) as Planet[]).filter((p) => planetSigns[p] === sign);
    return { house: i + 1, sign, planets };
  });
}

export function signsOf(longitudes: Record<Planet, number>): Record<Planet, number> {
  return Object.fromEntries(Object.entries(longitudes).map(([p, l]) => [p, signOf(l)])) as Record<Planet, number>;
}
