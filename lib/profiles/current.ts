import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { hasDatabase } from "@/lib/api/http";
import { getPrimaryProfile, type ProfileRow } from "@/lib/db/profiles";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserId } from "@/lib/supabase/server";

export type CurrentProfile =
  | { state: "unconfigured" }
  | { state: "signed-out" }
  | { state: "no-profile"; userId: string }
  | { state: "ready"; userId: string; profile: ProfileRow };

/** The signed-in user's primary profile, deduplicated per request. */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  // Per-user data: always render at request time, never prerender.
  await connection();
  if (!hasSupabaseEnv() || !hasDatabase()) return { state: "unconfigured" };
  const userId = await getUserId();
  if (!userId) return { state: "signed-out" };
  const profile = await getPrimaryProfile(userId);
  return profile ? { state: "ready", userId, profile } : { state: "no-profile", userId };
});

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
