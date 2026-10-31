import { renderToBuffer } from "@react-pdf/renderer";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/db/rate-limit";
import { getChart } from "@/lib/db/charts";
import { KundaliPdf } from "@/lib/pdf/KundaliPdf";
import { birthSummary, zoneSummary } from "@/lib/profiles/describe";
import { chartPdfQuerySchema } from "@/lib/validation/chart";

export const runtime = "nodejs";

/** GET /api/chart/:profileId/pdf?style=north|south — Kundali PDF download. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");
  const q = chartPdfQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!q.success) return jsonError(400, "style must be north or south.");

  if (!(await checkRateLimit(auth.userId, "chart.pdf", 30, 3600))) {
    return jsonError(429, "Too many downloads. Please try again later.");
  }

  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");
  const { profile, chart } = result;

  const pdf = await renderToBuffer(
    <KundaliPdf
      name={profile.fullName}
      birthLine={birthSummary(profile, { fullPlace: true })}
      zoneLine={zoneSummary(profile)}
      chart={chart}
      style={q.data.style}
    />,
  );

  const safeName = profile.fullName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "kundali";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kundali-${encodeURIComponent(safeName)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
