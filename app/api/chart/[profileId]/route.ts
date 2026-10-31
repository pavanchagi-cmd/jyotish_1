import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { getChart } from "@/lib/db/charts";

/** GET /api/chart/:profileId — computed chart JSON (no LLM). */
export async function GET(_request: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");

  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");
  return NextResponse.json({ chart: result.chart });
}
