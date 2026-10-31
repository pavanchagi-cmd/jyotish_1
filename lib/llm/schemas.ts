import { z } from "zod";

/**
 * Gemini output schemas (spec section 6). The JSON schema sent to Gemini is
 * derived from these, and every response is validated against them.
 */
const text = (max: number) => z.string().trim().min(1).max(max);

const point = z.object({
  title: text(80),
  meaning: text(400),
  example: text(300),
});

/**
 * Horoscope text. Lucky colour, lucky number and good time are computed in code
 * (owner decision), so Gemini only writes these three fields.
 */
export const horoscopeSchema = z.object({
  title: text(80),
  body: text(600),
  example: text(300),
});

export const kundaliExplanationSchema = z.object({
  lagna: point.nullable(),
  moon: point,
  highlights: z.array(point).min(2).max(4),
});

const note = z.object({
  name: text(40),
  meaning: text(400),
  example: text(300),
  tip: text(200),
});

export const matchSummarySchema = z.object({
  verdict: text(40),
  summary: text(500),
  kootaNotes: z.array(note).max(8),
  doshaNotes: z.array(note).max(4),
});

export const dashaSummarySchema = z.object({
  currentPeriod: z.object({ summary: text(500), example: text(300) }),
  transits: z
    .array(
      z.object({
        planet: z.enum(["Saturn", "Jupiter", "Rahu", "Ketu"]),
        houseFromMoon: z.number().int().min(1).max(12),
        meaning: text(300),
      }),
    )
    .max(4),
});

const area = z.object({
  rating: z.number().int().min(1).max(5),
  label: text(20),
  summary: text(400),
  example: text(300),
  tip: text(200),
});

/** One year of the 5-year forecast (spec section 6). */
export const forecastYearSchema = z.object({
  year: z.number().int(),
  headline: text(80),
  why: text(400),
  areas: z.object({ career: area, finance: area, family: area, health: area, marriage: area }),
});

/** Spec section 6: health text always ends with this sentence (added in code). */
export const HEALTH_DISCLAIMER = "Astrology is not medical advice. See a doctor for any symptoms.";

export type ForecastYear = z.infer<typeof forecastYearSchema>;
export type HoroscopeReading = z.infer<typeof horoscopeSchema>;
export type KundaliExplanation = z.infer<typeof kundaliExplanationSchema>;
export type MatchSummary = z.infer<typeof matchSummarySchema>;
export type DashaSummary = z.infer<typeof dashaSummarySchema>;

/** JSON schema for Gemini structured output. */
export function toGeminiSchema(schema: z.ZodType): unknown {
  return z.toJSONSchema(schema, { target: "draft-7" });
}
