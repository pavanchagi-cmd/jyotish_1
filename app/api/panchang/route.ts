import { NextResponse, type NextRequest } from "next/server";
import { DateTime } from "luxon";
import { jsonError, requireUser } from "@/lib/api/http";
import { panchang } from "@/lib/astro/panchang";
import { zoneForCoordinates } from "@/lib/time/zone";
import { panchangQuerySchema } from "@/lib/validation/astro";

/** GET /api/panchang?lat&lng&date — Panchang at local sunrise (no LLM). */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const q = panchangQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!q.success) return jsonError(400, "Invalid location or date.");
  const { lat, lng } = q.data;

  const zone = zoneForCoordinates(lat, lng);
  const date = q.data.date ?? DateTime.now().setZone(zone).toISODate()!;
  if (!DateTime.fromISO(date, { zone }).isValid) return jsonError(400, "Invalid date.");

  const result = panchang(date, lat, lng, zone);
  return NextResponse.json({ panchang: result }, { headers: { "Cache-Control": "private, max-age=600" } });
}
