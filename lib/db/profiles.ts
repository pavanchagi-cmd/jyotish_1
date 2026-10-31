import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { charts, profiles } from "./schema";

/**
 * Every query here filters by userId: Drizzle's connection bypasses RLS.
 */
export type ProfileRow = typeof profiles.$inferSelect;
type ProfileValues = Omit<typeof profiles.$inferInsert, "id" | "userId" | "isPrimary" | "createdAt">;

export async function getPrimaryProfile(userId: string): Promise<ProfileRow | null> {
  const rows = await getDb()
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), eq(profiles.isPrimary, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProfile(userId: string, id: string): Promise<ProfileRow | null> {
  const rows = await getDb()
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), eq(profiles.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

/** The user's first profile becomes their primary ("self") profile. */
export async function createProfile(userId: string, values: ProfileValues): Promise<ProfileRow> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), eq(profiles.isPrimary, true)))
      .limit(1);
    const [row] = await tx
      .insert(profiles)
      .values({ ...values, userId, isPrimary: existing.length === 0 })
      .returning();
    return row!;
  });
}

/** Updates a profile the user owns. Drops its cached chart so it is recomputed. */
export async function updateProfile(userId: string, id: string, values: ProfileValues): Promise<ProfileRow | null> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(profiles)
      .set(values)
      .where(and(eq(profiles.userId, userId), eq(profiles.id, id)))
      .returning();
    if (!row) return null;
    await tx.delete(charts).where(eq(charts.profileId, id));
    return row;
  });
}

/** Shape returned by the API: never includes user_id. */
export function publicProfile(p: ProfileRow) {
  return {
    id: p.id,
    fullName: p.fullName,
    gender: p.gender,
    birthLocal: p.birthLocal,
    birthUtc: p.birthUtc.toISOString(),
    timeKnown: p.timeKnown,
    placeName: p.placeName,
    lat: p.lat,
    lng: p.lng,
    tzIana: p.tzIana,
    utcOffsetSeconds: p.utcOffsetSeconds,
    tzConfirmed: p.tzConfirmed,
    language: p.language,
    isPrimary: p.isPrimary,
  };
}

/** All of the user's profiles, primary first. */
export async function listProfiles(userId: string): Promise<ProfileRow[]> {
  return getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(desc(profiles.isPrimary), asc(profiles.createdAt));
}
