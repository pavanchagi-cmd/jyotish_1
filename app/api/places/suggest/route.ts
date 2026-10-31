import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/api/http";
import { getGeocoder } from "@/lib/geo";
import { placeQuerySchema } from "@/lib/validation/birth";

/** GET /api/places/suggest?q= — type-ahead from the bundled GeoNames list. */
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const q = placeQuerySchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!q.success) return jsonError(400, "Type at least 2 characters.");

  const results = await getGeocoder().suggest(q.data, 8);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "private, max-age=300" } });
}
