import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { readingErrorResponse } from "@/lib/api/llm-errors";
import { ENGINE_VERSION } from "@/lib/astro/config";
import { getChart } from "@/lib/db/charts";
import { getOrCreateReading } from "@/lib/db/readings";
import { kundaliFacts } from "@/lib/llm/facts";
import { kundaliExplanationSchema } from "@/lib/llm/schemas";

/** GET /api/chart/:profileId/explain — "Your chart in simple words" (cached until birth data changes). */
export async function GET(_request: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  const id = z.uuid().safeParse((await ctx.params).profileId);
  if (!id.success) return jsonError(404, "Profile not found.");
  const result = await getChart(auth.userId, id.data);
  if (!result) return jsonError(404, "Profile not found.");

  try {
    const { content } = await getOrCreateReading({
      userId: auth.userId,
      feature: "kundali",
      tier: "deep",
      subjectKey: `profile:${result.profile.id}`,
      profileId: result.profile.id,
      // Facts change when birth data changes, which changes the facts hash.
      periodKey: `engine-${ENGINE_VERSION}`,
      language: result.profile.language,
      facts: kundaliFacts(result.chart),
      schema: kundaliExplanationSchema,
    });
    return NextResponse.json({ explanation: content });
  } catch (err) {
    return readingErrorResponse(err);
  }
}
