import { NextResponse } from "next/server";
import { parseJson, requireUser } from "@/lib/api/http";
import { BOMBAY_TIME_SECONDS, CALCUTTA_TIME_SECONDS, formatOffset } from "@/lib/time/offsets";
import { resolveZoneOffset, UNKNOWN_TIME } from "@/lib/time/resolve";
import { zoneForCoordinates } from "@/lib/time/zone";
import { resolveRequestSchema } from "@/lib/validation/birth";

/**
 * POST /api/places/resolve — coordinates + birth date/time → IANA zone and the
 * UTC offset in force at that moment (spec section 4, "Auto-detected" card).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await parseJson(request, resolveRequestSchema);
  if ("response" in body) return body.response;
  const { lat, lng, date, time } = body.data;

  const zone = zoneForCoordinates(lat, lng);
  const r = resolveZoneOffset(zone, date, time ?? UNKNOWN_TIME);

  const offsetOptions = r.needsOffsetChoice
    ? [
        { kind: "auto", label: `${r.zoneAbbreviation} · ${r.offsetLabel}`, seconds: r.offsetSeconds },
        { kind: "bombay", label: `Bombay Time · ${formatOffset(BOMBAY_TIME_SECONDS)}`, seconds: BOMBAY_TIME_SECONDS },
        { kind: "calcutta", label: `Calcutta Time · ${formatOffset(CALCUTTA_TIME_SECONDS)}`, seconds: CALCUTTA_TIME_SECONDS },
      ]
    : undefined;

  return NextResponse.json({ lat, lng, ...r, offsetOptions });
}
