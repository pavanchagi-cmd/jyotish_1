import { NextResponse } from "next/server";
import { hasDatabase, jsonError, parseJson, requireUser } from "@/lib/api/http";
import { ashtakoota } from "@/lib/astro/matching";
import { getChart } from "@/lib/db/charts";
import { saveMatch } from "@/lib/db/matches";
import { matchRequestSchema } from "@/lib/validation/astro";

/**
 * POST /api/match — Ashtakoota scores, doshas and Manglik check for two of the
 * user's profiles. The Gemini summary is added in phase 5.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const body = await parseJson(request, matchRequestSchema);
  if ("response" in body) return body.response;

  const [girl, boy] = await Promise.all([
    getChart(auth.userId, body.data.girlProfileId),
    getChart(auth.userId, body.data.boyProfileId),
  ]);
  if (!girl || !boy) return jsonError(404, "Profile not found.");

  const person = (c: typeof girl.chart) => ({ moon: c.planets.Moon.longitude, mars: c.planets.Mars.longitude, lagnaSign: c.lagna?.sign });
  const result = ashtakoota(person(girl.chart), person(boy.chart));
  const id = await saveMatch(auth.userId, girl.profile.id, boy.profile.id, result);

  return NextResponse.json({
    match: { id, ...result },
    // Moon-based scores are reliable without a birth time; Manglik from Lagna is not.
    approximate: !girl.profile.timeKnown || !boy.profile.timeKnown,
  });
}
