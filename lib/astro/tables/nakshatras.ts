import type { Planet } from "./planets";

/**
 * The 27 nakshatras, 13°20′ each from 0° Aries (sidereal).
 * - Lord: Vimshottari dasha lord, BPHS ch. 46 (sequence Ketu, Venus, Sun, Moon,
 *   Mars, Rahu, Jupiter, Saturn, Mercury, repeating from Ashwini).
 * - Gana, Yoni, Nadi: classical Ashtakoota attributes as tabulated in
 *   B. V. Raman, "Muhurtha (Electional Astrology)", ch. on marriage, and Muhurta
 *   Chintamani. TODO(verify): owner to confirm against Drik Panchang.
 */
export type Gana = "Deva" | "Manushya" | "Rakshasa";
export type Nadi = "Adi" | "Madhya" | "Antya";
export type Yoni =
  | "Horse"
  | "Elephant"
  | "Sheep"
  | "Serpent"
  | "Dog"
  | "Cat"
  | "Rat"
  | "Cow"
  | "Buffalo"
  | "Tiger"
  | "Deer"
  | "Monkey"
  | "Mongoose"
  | "Lion";

export interface NakshatraInfo {
  name: string;
  lord: Planet;
  gana: Gana;
  yoni: Yoni;
  nadi: Nadi;
}

export const NAKSHATRAS: readonly NakshatraInfo[] = [
  { name: "Ashwini", lord: "Ketu", gana: "Deva", yoni: "Horse", nadi: "Adi" },
  { name: "Bharani", lord: "Venus", gana: "Manushya", yoni: "Elephant", nadi: "Madhya" },
  { name: "Krittika", lord: "Sun", gana: "Rakshasa", yoni: "Sheep", nadi: "Antya" },
  { name: "Rohini", lord: "Moon", gana: "Manushya", yoni: "Serpent", nadi: "Antya" },
  { name: "Mrigashira", lord: "Mars", gana: "Deva", yoni: "Serpent", nadi: "Madhya" },
  { name: "Ardra", lord: "Rahu", gana: "Manushya", yoni: "Dog", nadi: "Adi" },
  { name: "Punarvasu", lord: "Jupiter", gana: "Deva", yoni: "Cat", nadi: "Adi" },
  { name: "Pushya", lord: "Saturn", gana: "Deva", yoni: "Sheep", nadi: "Madhya" },
  { name: "Ashlesha", lord: "Mercury", gana: "Rakshasa", yoni: "Cat", nadi: "Antya" },
  { name: "Magha", lord: "Ketu", gana: "Rakshasa", yoni: "Rat", nadi: "Antya" },
  { name: "Purva Phalguni", lord: "Venus", gana: "Manushya", yoni: "Rat", nadi: "Madhya" },
  { name: "Uttara Phalguni", lord: "Sun", gana: "Manushya", yoni: "Cow", nadi: "Adi" },
  { name: "Hasta", lord: "Moon", gana: "Deva", yoni: "Buffalo", nadi: "Adi" },
  { name: "Chitra", lord: "Mars", gana: "Rakshasa", yoni: "Tiger", nadi: "Madhya" },
  { name: "Swati", lord: "Rahu", gana: "Deva", yoni: "Buffalo", nadi: "Antya" },
  { name: "Vishakha", lord: "Jupiter", gana: "Rakshasa", yoni: "Tiger", nadi: "Antya" },
  { name: "Anuradha", lord: "Saturn", gana: "Deva", yoni: "Deer", nadi: "Madhya" },
  { name: "Jyeshtha", lord: "Mercury", gana: "Rakshasa", yoni: "Deer", nadi: "Adi" },
  { name: "Mula", lord: "Ketu", gana: "Rakshasa", yoni: "Dog", nadi: "Adi" },
  { name: "Purva Ashadha", lord: "Venus", gana: "Manushya", yoni: "Monkey", nadi: "Madhya" },
  { name: "Uttara Ashadha", lord: "Sun", gana: "Manushya", yoni: "Mongoose", nadi: "Antya" },
  { name: "Shravana", lord: "Moon", gana: "Deva", yoni: "Monkey", nadi: "Antya" },
  { name: "Dhanishta", lord: "Mars", gana: "Rakshasa", yoni: "Lion", nadi: "Madhya" },
  { name: "Shatabhisha", lord: "Rahu", gana: "Rakshasa", yoni: "Horse", nadi: "Adi" },
  { name: "Purva Bhadrapada", lord: "Jupiter", gana: "Manushya", yoni: "Lion", nadi: "Adi" },
  { name: "Uttara Bhadrapada", lord: "Saturn", gana: "Manushya", yoni: "Cow", nadi: "Madhya" },
  { name: "Revati", lord: "Mercury", gana: "Deva", yoni: "Elephant", nadi: "Antya" },
];

export const NAKSHATRA_SPAN = 360 / 27; // 13°20′
export const PADA_SPAN = NAKSHATRA_SPAN / 4; // 3°20′
