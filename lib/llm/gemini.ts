import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { serverEnv } from "@/lib/env";
import { findBannedPhrase, systemInstruction, type Language } from "./system";
import { toGeminiSchema } from "./schemas";

/**
 * The only Gemini entry point (spec section 6). Server-only: never import
 * from client components.
 */
export type ModelTier = "deep" | "fast";

export interface GenerateRequest<T extends z.ZodType> {
  tier: ModelTier;
  language: Language;
  /** Feature template (what to write). */
  instruction: string;
  /** Derived facts only — never names, birth date/time or place. */
  facts: unknown;
  schema: T;
}

export interface GenerateResult<T> {
  data: T;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export class LlmError extends Error {}

/** Minimal surface of the SDK we use, so tests can inject a fake. */
export interface GeminiClient {
  models: {
    generateContent(req: {
      model: string;
      contents: string;
      config: Record<string, unknown>;
    }): Promise<{ text?: string; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }>;
  };
}

let clientOverride: GeminiClient | null = null;
/** Tests only. */
export function setGeminiClientForTests(c: GeminiClient | null) {
  clientOverride = c;
}

function client(apiKey: string | undefined): GeminiClient {
  if (clientOverride) return clientOverride;
  if (!apiKey) throw new LlmError("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey }) as unknown as GeminiClient;
}

export function buildPrompt(instruction: string, facts: unknown): string {
  return `${instruction}\n\nFacts (JSON):\n${JSON.stringify(facts)}`;
}

/**
 * Calls Gemini with structured output, validates with Zod and the banned-phrase
 * check, retries once, then throws LlmError.
 */
export async function generateJson<T extends z.ZodType>(req: GenerateRequest<T>): Promise<GenerateResult<z.infer<T>>> {
  const env = serverEnv();
  const model = req.tier === "deep" ? env.GEMINI_MODEL_DEEP : env.GEMINI_MODEL_FAST;
  const ai = client(env.GEMINI_API_KEY);
  const config = {
    systemInstruction: systemInstruction(req.language),
    responseMimeType: "application/json",
    responseJsonSchema: toGeminiSchema(req.schema),
    // Safety settings are left at Gemini's defaults (spec section 6).
  };
  const contents = buildPrompt(req.instruction, req.facts);

  let lastProblem = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res: Awaited<ReturnType<GeminiClient["models"]["generateContent"]>>;
    try {
      res = await ai.models.generateContent({ model, contents, config });
    } catch (err) {
      lastProblem = `request failed: ${(err as Error).message}`;
      continue;
    }
    const usage = res.usageMetadata;
    console.info(`[llm] model=${model} attempt=${attempt} tokens_in=${usage?.promptTokenCount ?? "?"} tokens_out=${usage?.candidatesTokenCount ?? "?"}`);
    let json: unknown;
    try {
      json = JSON.parse(res.text ?? "");
    } catch {
      lastProblem = "response was not JSON";
      continue;
    }
    const parsed = req.schema.safeParse(json);
    if (!parsed.success) {
      lastProblem = `schema mismatch: ${parsed.error.issues[0]?.message ?? "invalid"}`;
      continue;
    }
    const banned = findBannedPhrase(parsed.data);
    if (banned) {
      lastProblem = `banned phrase "${banned}"`;
      continue;
    }
    return { data: parsed.data, model, tokensIn: usage?.promptTokenCount ?? null, tokensOut: usage?.candidatesTokenCount ?? null };
  }
  console.warn(`[llm] giving up after 2 attempts: ${lastProblem}`);
  throw new LlmError(lastProblem);
}
