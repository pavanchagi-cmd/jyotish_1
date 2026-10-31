import { NextResponse, type NextRequest } from "next/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { readingErrorResponse } from "@/lib/api/llm-errors";
import { panchang } from "@/lib/astro/panchang";
import { LUCKY, VARA_LORD } from "@/lib/astro/tables/lucky";
import { SIGNS } from "@/lib/astro/tables/signs";
import type { Planet } from "@/lib/astro/tables/planets";
import { getChart } from "@/lib/db/charts";
import { getOrCreateReading } from "@/lib/db/readings";
import { horoscopeFacts } from "@/lib/llm/facts";
import { periodKey, periodRange } from "@/lib/llm/periods";
import { horoscopeSchema } from "@/lib/llm/schemas";
import { zoneForCoordinates } from "@/lib/time/zone";

const querySchema = z.object({
  profileId: z.uuid(),
  period: z.enum(["day", "week", "month"]),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

/**
 * GET /api/horoscope?profileId&period=day|week|month[&lat&lng]
 * Text from Gemini (cached per Moon sign + Lagna + period + language);
 * lucky colour/number and good time (Abhijit) computed in code.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const q = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!q.success) return jsonError(400, "Invalid request.");

  const result = await getChart(auth.userId, q.data.profileId);
  if (!result) return jsonError(404, "Profile not found.");
  const { profile, chart } = result;

  const lat = q.data.lat ?? profile.lat;
  const lng = q.data.lng ?? profile.lng;
  const zone = zoneForCoordinates(lat, lng);
  const now = new Date();
  const period = q.data.period;
  const key = periodKey(period, now, zone);
  const range = periodRange(period, now, zone);
  const midpoint = new Date((range.start.toMillis() + range.end.toMillis()) / 2);

  const moonSign = chart.planets.Moon.sign;
  const lagnaSign = chart.lagna?.sign;
  const facts = horoscopeFacts({ period, periodLabel: key, moonSign, lagnaSign, at: midpoint });

  const today = DateTime.fromJSDate(now, { zone }).toISODate()!;
  const p = panchang(today, lat, lng, zone);
  const luckyPlanet: Planet = period === "day" ? VARA_LORD[p.vara.index]! : (SIGNS[moonSign]!.lord as Planet);

  try {
    const { content, cached } = await getOrCreateReading({
      userId: auth.userId,
      feature: "horoscope",
      tier: "fast",
      subjectKey: `sign:moon=${moonSign};lagna=${lagnaSign ?? "none"}`,
      periodKey: key,
      language: profile.language,
      facts,
      schema: horoscopeSchema,
    });
    return NextResponse.json({
      period,
      periodKey: key,
      reading: content,
      cached,
      lucky: { ...LUCKY[luckyPlanet], planet: luckyPlanet },
      goodTime: p.abhijit ? { start: p.abhijit.start, end: p.abhijit.end, zone, avoidToday: p.abhijit.avoidOnWednesday } : null,
      moonSignOnly: !chart.timeKnown,
    });
  } catch (err) {
    return readingErrorResponse(err);
  }
}
