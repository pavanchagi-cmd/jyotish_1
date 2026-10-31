import type { Planet } from "./planets";

/**
 * The 12 rashis (sidereal signs), 30° each from 0° Aries.
 * Rulers per Brihat Parashara Hora Shastra (BPHS) ch. 4; Rahu/Ketu rule none.
 */
export const SIGNS = [
  { en: "Aries", sa: "Mesha", lord: "Mars" },
  { en: "Taurus", sa: "Vrishabha", lord: "Venus" },
  { en: "Gemini", sa: "Mithuna", lord: "Mercury" },
  { en: "Cancer", sa: "Karka", lord: "Moon" },
  { en: "Leo", sa: "Simha", lord: "Sun" },
  { en: "Virgo", sa: "Kanya", lord: "Mercury" },
  { en: "Libra", sa: "Tula", lord: "Venus" },
  { en: "Scorpio", sa: "Vrishchika", lord: "Mars" },
  { en: "Sagittarius", sa: "Dhanu", lord: "Jupiter" },
  { en: "Capricorn", sa: "Makara", lord: "Saturn" },
  { en: "Aquarius", sa: "Kumbha", lord: "Saturn" },
  { en: "Pisces", sa: "Meena", lord: "Jupiter" },
] as const satisfies ReadonlyArray<{ en: string; sa: string; lord: Planet }>;

/** 0 = Aries … 11 = Pisces */
export type SignIndex = number;
