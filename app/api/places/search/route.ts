import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, parseJson, requireUser } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/db/rate-limit";
import { ThrottleBusyError } from "@/lib/db/throttle";
import { getGeocoder } from "@/lib/geo";
import { NominatimError } from "@/lib/geo/nominatim";
import { placeQuerySchema } from "@/lib/validation/birth";

const bodySchema = z.object({ q: placeQuerySchema });

/** POST /api/places/search — Nominatim fallback, only when the user taps "Search". */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Place search is not configured yet.");

  const body = await parseJson(request, bodySchema);
  if ("response" in body) return body.response;

  if (!(await checkRateLimit(auth.userId, "places.search", 30, 3600))) {
    return jsonError(429, "Too many searches. Please try again later.");
  }

  try {
    const results = await getGeocoder().search(body.data.q, 8);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof ThrottleBusyError) return jsonError(503, err.message);
    if (err instanceof NominatimError) {
      console.error("[places.search]", err.message);
      return jsonError(502, "Place search is unavailable right now. Please try again.");
    }
    throw err;
  }
}
