import "server-only";
import { LlmError } from "@/lib/llm/gemini";
import { RateLimitedError } from "@/lib/db/readings";
import { jsonError } from "./http";

/** Maps reading failures to friendly responses; rethrows anything else. */
export function readingErrorResponse(err: unknown) {
  if (err instanceof RateLimitedError) return jsonError(429, err.message);
  if (err instanceof LlmError) return jsonError(503, "Your reading could not be written right now. Please try again in a minute.");
  throw err;
}
