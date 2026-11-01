import { NextResponse } from "next/server";
import { envCheck } from "@/lib/health/envCheck";

export const dynamic = "force-dynamic";

/**
 * GET /api/env-check — public, no values: true/false per required setting
 * (at build and at run time), plus VERCEL_ENV, git branch/commit and the
 * deployment URL, so the owner can see which deployment they are looking at.
 */
export function GET() {
  return NextResponse.json(envCheck(), { headers: { "Cache-Control": "no-store" } });
}
