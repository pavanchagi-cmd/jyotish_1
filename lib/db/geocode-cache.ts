import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "./index";
import { geocodeCache } from "./schema";

const TTL_DAYS = 30;

export async function getCached<T>(key: string): Promise<T | null> {
  const db = getDb();
  const rows = await db
    .select({ results: geocodeCache.results })
    .from(geocodeCache)
    .where(and(eq(geocodeCache.key, key), gt(geocodeCache.createdAt, sql`now() - ${`${TTL_DAYS} days`}::interval`)))
    .limit(1);
  return (rows[0]?.results as T | undefined) ?? null;
}

export async function setCached(key: string, results: unknown): Promise<void> {
  const db = getDb();
  await db
    .insert(geocodeCache)
    .values({ key, results })
    .onConflictDoUpdate({ target: geocodeCache.key, set: { results, createdAt: sql`now()` } });
}
