import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, parseJson, requireUser } from "@/lib/api/http";
import { setPrimaryLanguage } from "@/lib/db/account";
import { languageSchema } from "@/lib/validation/birth";

/** PUT /api/me/language — reading language for the user's own profile. */
export async function PUT(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");
  const body = await parseJson(request, z.object({ language: languageSchema }));
  if ("response" in body) return body.response;
  if (!(await setPrimaryLanguage(auth.userId, body.data.language))) return jsonError(404, "Add your birth details first.");
  return NextResponse.json({ language: body.data.language });
}
