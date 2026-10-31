import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { readingErrorResponse } from "@/lib/api/llm-errors";
import { forecastFacts } from "@/lib/astro/forecastFacts";
import { getChart } from "@/lib/db/charts";
import { getOrCreateReading } from "@/lib/db/readings";
import { finaliseForecast, forecastYears } from "@/lib/llm/forecast";
import { forecastYearSchema } from "@/lib/llm/schemas";

/**
 * GET /api/forecast/:profileId?year= — one year of the 5-year forecast.
 * One Gemini request per year; cached per year and regenerated each 1 January.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");
  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");

  const years = forecastYears(new Date(), result.profile.tzIana);
  const year = z.coerce.number().int().safeParse(request.nextUrl.searchParams.get("year") ?? years[0]);
  if (!year.success || !years.includes(year.data)) return jsonError(400, `year must be one of ${years.join(", ")}.`);

  try {
    const { content } = await getOrCreateReading({
      userId: auth.userId,
      feature: "forecast",
      tier: "deep",
      subjectKey: `profile:${result.profile.id}`,
      profileId: result.profile.id,
      // Includes the current year, so every forecast regenerates on 1 January.
      periodKey: `${year.data}@${years[0]}`,
      language: result.profile.language,
      facts: forecastFacts(result.chart, year.data),
      schema: forecastYearSchema,
    });
    return NextResponse.json({ years, forecast: finaliseForecast(year.data, content), approximate: !result.chart.timeKnown });
  } catch (err) {
    return readingErrorResponse(err);
  }
}
