import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserId } from "@/lib/supabase/server";

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Returns the signed-in user's id, or an error response to return as-is. */
export async function requireUser(): Promise<{ userId: string } | { response: NextResponse }> {
  if (!hasSupabaseEnv()) return { response: jsonError(503, "Sign-in is not configured yet.") };
  const userId = await getUserId();
  if (!userId) return { response: jsonError(401, "Please sign in.") };
  return { userId };
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: jsonError(400, "Request body must be JSON.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { response: jsonError(400, "Invalid request.", { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }) };
  }
  return { data: parsed.data };
}
