import "server-only";
import { and, eq } from "drizzle-orm";
import { computeChart, type ChartData } from "@/lib/astro/chart";
import { ENGINE_CONFIG, ENGINE_VERSION } from "@/lib/astro/config";
import { getDb } from "./index";
import type { ProfileRow } from "./profiles";
import { charts, profiles } from "./schema";

export function chartForProfile(p: Pick<ProfileRow, "birthUtc" | "lat" | "lng" | "timeKnown">): ChartData {
  return computeChart({ birthUtc: p.birthUtc, lat: p.lat, lng: p.lng, timeKnown: p.timeKnown });
}

/** Computes and stores the chart for a profile (replacing any older one). */
export async function saveChart(profile: ProfileRow): Promise<ChartData> {
  const data = chartForProfile(profile);
  const values = { engineVersion: ENGINE_VERSION, ayanamsa: ENGINE_CONFIG.ayanamsa, data, computedAt: new Date() };
  await getDb()
    .insert(charts)
    .values({ profileId: profile.id, ...values })
    .onConflictDoUpdate({ target: charts.profileId, set: values });
  return data;
}

/**
 * The stored chart for a profile the user owns, recomputed when missing or
 * made by an older engine version. Null if the profile isn't the user's.
 */
export async function getChart(userId: string, profileId: string): Promise<{ profile: ProfileRow; chart: ChartData } | null> {
  const rows = await getDb()
    .select({ profile: profiles, chart: charts })
    .from(profiles)
    .leftJoin(charts, eq(charts.profileId, profiles.id))
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.chart && row.chart.engineVersion === ENGINE_VERSION) {
    return { profile: row.profile, chart: row.chart.data as ChartData };
  }
  return { profile: row.profile, chart: await saveChart(row.profile) };
}
