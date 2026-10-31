import { type NextRequest } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { chartGeometry } from "@/lib/chart/geometry";
import { geometryToSvg } from "@/lib/chart/svg-string";
import { chartView, DIVISION_LABELS } from "@/lib/chart/view";
import { getChart } from "@/lib/db/charts";
import { chartImageQuerySchema } from "@/lib/validation/chart";

/** GET /api/chart/:profileId/svg?style=north|south&div=D1|D9|moon */
export async function GET(request: NextRequest, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");
  const q = chartImageQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!q.success) return jsonError(400, "style must be north or south; div must be D1, D9 or moon.");

  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");
  const view = chartView(result.chart, q.data.div);
  if (!view) return jsonError(422, "This chart needs an exact birth time.");

  const title = `${q.data.style === "north" ? "North" : "South"} Indian ${DIVISION_LABELS[q.data.div]} chart`;
  return new Response(geometryToSvg(chartGeometry(view, q.data.style), title), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "private, max-age=300" },
  });
}
