import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/health/checks";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — setup status for the owner (no secrets): which settings
 * exist, whether the database is reachable and migrated, and the city list size.
 */
export async function GET() {
  const report = await runHealthChecks();
  return NextResponse.json(report, { status: report.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
