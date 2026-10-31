import { NextResponse } from "next/server";
import { hasConsent, recordConsent } from "@/lib/db/account";
import { saveChart } from "@/lib/db/charts";
import { hasDatabase, jsonError, parseJson, requireUser } from "@/lib/api/http";
import { createProfile, publicProfile } from "@/lib/db/profiles";
import { profileColumns } from "@/lib/profiles/compute";
import { OffsetChoiceError } from "@/lib/time/resolve";
import { zoneForCoordinates } from "@/lib/time/zone";
import { profileInputSchema } from "@/lib/validation/birth";

/** POST /api/profiles — create a profile. The server recomputes the UTC instant. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Saving is not configured yet.");

  const body = await parseJson(request, profileInputSchema);
  if ("response" in body) return body.response;

  // DPDP consent: required before storing anyone's birth details.
  if (body.data.consent !== true) {
    return jsonError(400, "Please confirm the privacy consent to continue.", { issues: [{ path: "consent", message: "Required" }] });
  }

  try {
    if (!(await hasConsent(auth.userId))) await recordConsent(auth.userId);
    const zone = zoneForCoordinates(body.data.place.lat, body.data.place.lng);
    const row = await createProfile(auth.userId, profileColumns(body.data, zone));
    await saveChart(row);
    return NextResponse.json({ profile: publicProfile(row) }, { status: 201 });
  } catch (err) {
    if (err instanceof OffsetChoiceError) return jsonError(422, err.message);
    throw err;
  }
}
