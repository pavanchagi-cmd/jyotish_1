import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { readingErrorResponse } from "@/lib/api/llm-errors";
import type { KootaScore, MatchResult } from "@/lib/astro/matching";
import { getMatch } from "@/lib/db/matches";
import { getProfile } from "@/lib/db/profiles";
import { getOrCreateReading } from "@/lib/db/readings";
import { matchFacts } from "@/lib/llm/facts";
import { matchSummarySchema } from "@/lib/llm/schemas";

/** GET /api/match/:matchId/summary — Gemini explanation of a stored match (cached per pair). */
export async function GET(_request: Request, ctx: { params: Promise<{ matchId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).matchId);
  if (!id.success) return jsonError(404, "Match not found.");
  const match = await getMatch(auth.userId, id.data);
  if (!match) return jsonError(404, "Match not found.");

  const kootas = match.scores as KootaScore[];
  const { manglik, ...doshas } = match.doshas as MatchResult["doshas"] & { manglik: MatchResult["manglik"] };
  const result: MatchResult = { kootas, total: Number(match.total), max: 36, doshas, manglik };
  const owner = await getProfile(auth.userId, match.profileA);

  try {
    const { content } = await getOrCreateReading({
      userId: auth.userId,
      feature: "match",
      tier: "deep",
      subjectKey: `match:${match.id}`,
      matchId: match.id,
      periodKey: "pair",
      language: owner?.language ?? "en",
      facts: matchFacts(result),
      schema: matchSummarySchema,
    });
    return NextResponse.json({ summary: content });
  } catch (err) {
    return readingErrorResponse(err);
  }
}
