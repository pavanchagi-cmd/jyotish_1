import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { dashaReport } from "@/lib/astro/dasha-summary";
import { getChart } from "@/lib/db/charts";

/**
 * GET /api/dasha/:profileId — current dasha, timeline, Gochar and Sade Sati.
 * The Gemini summary is added in phase 5.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");

  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");
  return NextResponse.json({ dasha: dashaReport(result.chart, new Date()) });
}
