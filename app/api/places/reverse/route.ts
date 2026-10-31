import { NextResponse, type NextRequest } from "next/server";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/db/rate-limit";
import { ThrottleBusyError } from "@/lib/db/throttle";
import { getGeocoder } from "@/lib/geo";
import { NominatimError } from "@/lib/geo/nominatim";
import { reverseQuerySchema } from "@/lib/validation/astro";

/** GET /api/places/reverse?lat&lng — place name for the Panchang card (Nominatim, cached). */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const q = reverseQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!q.success) return jsonError(400, "Invalid location.");

  if (!(await checkRateLimit(auth.userId, "places.reverse", 60, 3600))) {
    return jsonError(429, "Too many requests. Please try again later.");
  }
  try {
    const place = await getGeocoder().reverse(q.data.lat, q.data.lng);
    return NextResponse.json({ place }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (err) {
    if (err instanceof ThrottleBusyError || err instanceof NominatimError) return NextResponse.json({ place: null });
    throw err;
  }
}
