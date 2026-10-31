import type { Yoni } from "./nakshatras";

/**
 * Ashtakoota (guna milan) tables. Maximum points: Varna 1, Vashya 2, Tara 3,
 * Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8 = 36.
 *
 * Sources: Muhurta Chintamani (Vivaha prakarana) and B. V. Raman, "Muhurtha
 * (Electional Astrology)", marriage chapter.
 *
 * Several classical texts and software differ on some cells (notably Vashya,
 * Yoni and Gana). Tables marked TODO(verify) must be checked by the owner
 * against Drik Panchang before release; see lib/astro/matching.test.ts.
 */

export const KOOTA_MAX = {
  varna: 1,
  vashya: 2,
  tara: 3,
  yoni: 4,
  grahaMaitri: 5,
  gana: 6,
  bhakoot: 7,
  nadi: 8,
} as const;

export type KootaName = keyof typeof KOOTA_MAX;

/** Varna by Moon sign (0 = Aries). Higher number = higher varna. Brahmin 4, Kshatriya 3, Vaishya 2, Shudra 1. */
export const VARNA_BY_SIGN = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4] as const;
export const VARNA_NAMES = { 4: "Brahmin", 3: "Kshatriya", 2: "Vaishya", 1: "Shudra" } as const;

export type VashyaGroup = "Chatushpada" | "Manava" | "Jalachara" | "Vanachara" | "Keeta";

/**
 * Vashya group by Moon sign. Sagittarius: first half Manava, second half
 * Chatushpada. Capricorn: first half Chatushpada, second half Jalachara.
 */
export function vashyaGroup(sign: number, degreeInSign: number): VashyaGroup {
  switch (sign) {
    case 0:
    case 1:
      return "Chatushpada";
    case 2:
    case 5:
    case 6:
    case 10:
      return "Manava";
    case 3:
    case 11:
      return "Jalachara";
    case 4:
      return "Vanachara";
    case 7:
      return "Keeta";
    case 8:
      return degreeInSign < 15 ? "Manava" : "Chatushpada";
    case 9:
      return degreeInSign < 15 ? "Chatushpada" : "Jalachara";
    default:
      throw new Error(`bad sign ${sign}`);
  }
}

/**
 * Vashya points, [boy group][girl group].
 * TODO(verify): cell values differ between sources; owner to confirm.
 */
export const VASHYA_POINTS: Record<VashyaGroup, Record<VashyaGroup, number>> = {
  Chatushpada: { Chatushpada: 2, Manava: 1, Jalachara: 1, Vanachara: 0.5, Keeta: 1 },
  Manava: { Chatushpada: 1, Manava: 2, Jalachara: 0.5, Vanachara: 0, Keeta: 1 },
  Jalachara: { Chatushpada: 1, Manava: 0.5, Jalachara: 2, Vanachara: 1, Keeta: 1 },
  Vanachara: { Chatushpada: 0.5, Manava: 0, Jalachara: 1, Vanachara: 2, Keeta: 0 },
  Keeta: { Chatushpada: 1, Manava: 1, Jalachara: 1, Vanachara: 0, Keeta: 2 },
};

export const YONI_ORDER: readonly Yoni[] = [
  "Horse",
  "Elephant",
  "Sheep",
  "Serpent",
  "Dog",
  "Cat",
  "Rat",
  "Cow",
  "Buffalo",
  "Tiger",
  "Deer",
  "Monkey",
  "Mongoose",
  "Lion",
];

/** Sworn-enemy yoni pairs (0 points). */
export const YONI_ENEMIES: readonly [Yoni, Yoni][] = [
  ["Horse", "Buffalo"],
  ["Elephant", "Lion"],
  ["Sheep", "Monkey"],
  ["Serpent", "Mongoose"],
  ["Dog", "Deer"],
  ["Cat", "Rat"],
  ["Cow", "Tiger"],
];

/**
 * Yoni points (symmetric), rows/columns in YONI_ORDER.
 * Same yoni 4, sworn enemies 0.
 * TODO(verify): the remaining cells differ between sources; owner to confirm.
 */
export const YONI_POINTS: readonly (readonly number[])[] = [
  //Ho El Sh Se Do Ca Ra Co Bu Ti De Mo Mn Li
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1], // Horse
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], // Elephant
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1], // Sheep
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], // Serpent
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], // Dog
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1], // Cat
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], // Rat
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], // Cow
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1], // Buffalo
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], // Tiger
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], // Deer
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2], // Monkey
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], // Mongoose
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4], // Lion
];

/**
 * Graha Maitri points from the two Moon-sign lords' mutual relationship.
 * Key is the two relations sorted: "friend+friend" etc. Same lord = 5.
 */
export const GRAHA_MAITRI_POINTS: Record<string, number> = {
  "friend+friend": 5,
  "friend+neutral": 4,
  "neutral+neutral": 3,
  "enemy+friend": 1,
  "enemy+neutral": 0.5,
  "enemy+enemy": 0,
};

/**
 * Gana points, [boy gana][girl gana].
 * TODO(verify): Deva–Rakshasa and Manushya–Deva cells differ between sources.
 */
export const GANA_POINTS = {
  Deva: { Deva: 6, Manushya: 6, Rakshasa: 1 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 1, Manushya: 0, Rakshasa: 6 },
} as const;

/** Bhakoot: sign distance pairs (girl→boy, boy→girl) that give 0 points (dosha). */
export const BHAKOOT_DOSHA_DISTANCES: readonly [number, number][] = [
  [2, 12],
  [12, 2],
  [5, 9],
  [9, 5],
  [6, 8],
  [8, 6],
];

/**
 * Manglik: Mars in these houses from Lagna (and, separately, from the Moon).
 * TODO(verify): some traditions omit the 2nd house or add cancellation rules.
 */
export const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12] as const;
