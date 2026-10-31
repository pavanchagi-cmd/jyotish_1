import "server-only";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { generateJson, type ModelTier } from "@/lib/llm/gemini";
import { factsHash } from "@/lib/llm/facts";
import { PROMPTS, type Feature } from "@/lib/llm/prompts";
import type { Language } from "@/lib/llm/system";
import { getDb } from "./index";
import { checkRateLimit } from "./rate-limit";
import { readings } from "./schema";

export class RateLimitedError extends Error {}

/** Spec section 6: ~30 Gemini calls an hour per user. Cache hits don't count. */
export const LLM_CALLS_PER_HOUR = 30;

export interface ReadingRequest<T extends z.ZodType> {
  userId: string;
  feature: Feature;
  tier: ModelTier;
  /** "profile:<id>", "match:<id>" or a shared key such as "sign:moon=4;lagna=5". */
  subjectKey: string;
  profileId?: string | null;
  matchId?: string | null;
  periodKey: string;
  language: Language;
  facts: unknown;
  schema: T;
}

/**
 * Returns the cached reading for (subject, feature, period, facts, prompt
 * version, language), or generates, validates and stores it.
 */
export async function getOrCreateReading<T extends z.ZodType>(req: ReadingRequest<T>): Promise<{ content: z.infer<T>; cached: boolean }> {
  const db = getDb();
  const prompt = PROMPTS[req.feature];
  const hash = factsHash(req.facts);
  const key = and(
    eq(readings.subjectKey, req.subjectKey),
    eq(readings.feature, req.feature),
    eq(readings.periodKey, req.periodKey),
    eq(readings.factsHash, hash),
    eq(readings.promptVersion, prompt.version),
    eq(readings.language, req.language),
  );

  const [hit] = await db.select({ content: readings.content }).from(readings).where(key).limit(1);
  if (hit) {
    const parsed = req.schema.safeParse(hit.content);
    if (parsed.success) return { content: parsed.data, cached: true };
  }

  if (!(await checkRateLimit(req.userId, "llm", LLM_CALLS_PER_HOUR, 3600))) {
    throw new RateLimitedError("You have reached the reading limit for this hour. Please try again later.");
  }

  const result = await generateJson({ tier: req.tier, language: req.language, instruction: prompt.instruction, facts: req.facts, schema: req.schema });

  await db
    .insert(readings)
    .values({
      subjectKey: req.subjectKey,
      profileId: req.profileId ?? null,
      matchId: req.matchId ?? null,
      feature: req.feature,
      periodKey: req.periodKey,
      language: req.language,
      factsHash: hash,
      promptVersion: prompt.version,
      model: result.model,
      content: result.data,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    })
    .onConflictDoNothing();

  return { content: result.data, cached: false };
}
