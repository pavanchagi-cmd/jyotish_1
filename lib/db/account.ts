import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { getDb } from "./index";
import { consents, matches, profiles, readings, usageEvents } from "./schema";

/** Privacy notice version the user agreed to (bump when /privacy changes materially). */
export const CONSENT_VERSION = "2026-10-31";

export async function hasConsent(userId: string): Promise<boolean> {
  const rows = await getDb().select({ v: consents.version }).from(consents).where(eq(consents.userId, userId)).limit(1);
  return rows.length > 0;
}

export async function recordConsent(userId: string): Promise<void> {
  await getDb()
    .insert(consents)
    .values({ userId, version: CONSENT_VERSION })
    .onConflictDoUpdate({ target: consents.userId, set: { version: CONSENT_VERSION, consentedAt: new Date() } });
}

/**
 * "Delete my data" (spec section 9): removes every row this app stores for the
 * user. Shared, sign-level horoscope readings hold no personal data and stay.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  await getDb().transaction(async (tx) => {
    const own = await tx.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId));
    const ids = own.map((p) => p.id);
    const ownMatches = await tx.select({ id: matches.id }).from(matches).where(eq(matches.userId, userId));
    const matchIds = ownMatches.map((m) => m.id);
    if (ids.length || matchIds.length) {
      const conds = [ids.length ? inArray(readings.profileId, ids) : undefined, matchIds.length ? inArray(readings.matchId, matchIds) : undefined].filter(
        (c): c is NonNullable<typeof c> => Boolean(c),
      );
      await tx.delete(readings).where(or(...conds));
    }
    await tx.delete(matches).where(eq(matches.userId, userId));
    await tx.delete(profiles).where(eq(profiles.userId, userId)); // charts cascade
    await tx.delete(usageEvents).where(eq(usageEvents.userId, userId));
    await tx.delete(consents).where(eq(consents.userId, userId));
  });
}

/** Deletes a non-primary profile (partner, family) the user owns. */
export async function deleteSecondaryProfile(userId: string, profileId: string): Promise<"deleted" | "not-found" | "primary"> {
  const [row] = await getDb()
    .select({ isPrimary: profiles.isPrimary })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  if (!row) return "not-found";
  if (row.isPrimary) return "primary";
  await getDb().delete(profiles).where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)));
  return "deleted";
}

export async function setPrimaryLanguage(userId: string, language: "en" | "hi" | "kn"): Promise<boolean> {
  const rows = await getDb()
    .update(profiles)
    .set({ language })
    .where(and(eq(profiles.userId, userId), eq(profiles.isPrimary, true)))
    .returning({ id: profiles.id });
  return rows.length > 0;
}
