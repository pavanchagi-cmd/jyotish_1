import type { Planet } from "./planets";

/**
 * Vimshottari mahadasha order and lengths in years (total 120), BPHS ch. 46.
 */
export const VIMSHOTTARI: readonly { lord: Planet; years: number }[] = [
  { lord: "Ketu", years: 7 },
  { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 },
  { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 },
  { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 },
  { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 },
];

export const VIMSHOTTARI_TOTAL_YEARS = 120;
