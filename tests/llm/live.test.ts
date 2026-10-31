/**
 * Live Gemini smoke tests (spec section 10). Off by default; run with
 *   RUN_LLM_TESTS=1 GEMINI_API_KEY=... npm test -- tests/llm
 */
import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { dashaReport } from "@/lib/astro/dasha-summary";
import { ashtakoota } from "@/lib/astro/matching";
import { generateJson } from "@/lib/llm/gemini";
import { dashaFacts, horoscopeFacts, kundaliFacts, matchFacts } from "@/lib/llm/facts";
import { PROMPTS } from "@/lib/llm/prompts";
import { dashaSummarySchema, horoscopeSchema, kundaliExplanationSchema, matchSummarySchema } from "@/lib/llm/schemas";
import { findBannedPhrase } from "@/lib/llm/system";

const RUN = process.env.RUN_LLM_TESTS === "1";
const chart = computeChart({ birthUtc: new Date("1995-08-14T01:12:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: true });
const DEVANAGARI = /[ऀ-ॿ]/;
const KANNADA = /[ಀ-೿]/;

describe.skipIf(!RUN)("Gemini live smoke tests", () => {
  const cases = [
    { name: "horoscope", tier: "fast" as const, schema: horoscopeSchema, facts: horoscopeFacts({ period: "day", periodLabel: "today", moonSign: 11, lagnaSign: 4, at: new Date() }) },
    { name: "kundali", tier: "deep" as const, schema: kundaliExplanationSchema, facts: kundaliFacts(chart) },
    { name: "dasha", tier: "deep" as const, schema: dashaSummarySchema, facts: dashaFacts(dashaReport(chart, new Date())) },
    { name: "match", tier: "deep" as const, schema: matchSummarySchema, facts: matchFacts(ashtakoota({ moon: 100, mars: 10 }, { moon: 200, mars: 20 })) },
  ] as const;

  for (const c of cases) {
    it(`${c.name}: valid JSON, no banned phrases`, { timeout: 60_000 }, async () => {
      const r = await generateJson({ tier: c.tier, language: "en", instruction: PROMPTS[c.name].instruction, facts: c.facts, schema: c.schema });
      expect(c.schema.safeParse(r.data).success).toBe(true);
      expect(findBannedPhrase(r.data)).toBeNull();
    });
  }

  it("answers in Hindi and Kannada", { timeout: 60_000 }, async () => {
    const base = { tier: "fast" as const, instruction: PROMPTS.horoscope.instruction, facts: cases[0].facts, schema: horoscopeSchema };
    expect(JSON.stringify((await generateJson({ ...base, language: "hi" })).data)).toMatch(DEVANAGARI);
    expect(JSON.stringify((await generateJson({ ...base, language: "kn" })).data)).toMatch(KANNADA);
  });
});
