import { NextResponse } from "next/server";
import { z } from "zod";
import { saveChart } from "@/lib/db/charts";
import { hasDatabase, jsonError, parseJson, requireUser } from "@/lib/api/http";
import { publicProfile, updateProfile } from "@/lib/db/profiles";
import { profileColumns } from "@/lib/profiles/compute";
import { OffsetChoiceError } from "@/lib/time/resolve";
import { zoneForCoordinates } from "@/lib/time/zone";
import { profileInputSchema } from "@/lib/validation/birth";

const idSchema = z.uuid();

/** PATCH /api/profiles/:id — replace a profile's birth details (owner only). */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Saving is not configured yet.");

  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return jsonError(404, "Profile not found.");

  const body = await parseJson(request, profileInputSchema);
  if ("response" in body) return body.response;

  try {
    const zone = zoneForCoordinates(body.data.place.lat, body.data.place.lng);
    const row = await updateProfile(auth.userId, id.data, profileColumns(body.data, zone));
    if (!row) return jsonError(404, "Profile not found.");
    await saveChart(row);
    return NextResponse.json({ profile: publicProfile(row) });
  } catch (err) {
    if (err instanceof OffsetChoiceError) return jsonError(422, err.message);
    throw err;
  }
}
