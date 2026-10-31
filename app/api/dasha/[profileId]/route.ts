import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { readingErrorResponse } from "@/lib/api/llm-errors";
import { dashaReport } from "@/lib/astro/dasha-summary";
import { getChart } from "@/lib/db/charts";
import { getOrCreateReading } from "@/lib/db/readings";
import { dashaFacts } from "@/lib/llm/facts";
import { dashaSummarySchema } from "@/lib/llm/schemas";

/**
 * GET /api/dasha/:profileId[?summary=1] — dasha tree, Gochar, Sade Sati, and
 * with summary=1 the Gemini summary (cached per antardasha + month).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");

  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");
  const now = new Date();
  const report = dashaReport(result.chart, now);
  if (request.nextUrl.searchParams.get("summary") !== "1") return NextResponse.json({ dasha: report });

  try {
    const { content } = await getOrCreateReading({
      userId: auth.userId,
      feature: "dasha",
      tier: "deep",
      subjectKey: `profile:${result.profile.id}`,
      profileId: result.profile.id,
      periodKey: `${report.current?.antardasha.start.slice(0, 10) ?? "none"}:${now.toISOString().slice(0, 7)}`,
      language: result.profile.language,
      facts: dashaFacts(report),
      schema: dashaSummarySchema,
    });
    return NextResponse.json({ dasha: report, summary: content });
  } catch (err) {
    return readingErrorResponse(err);
  }
}
