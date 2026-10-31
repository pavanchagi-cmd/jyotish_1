import "server-only";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { getDb } from "./index";
import { usageEvents } from "./schema";

/**
 * Per-user rate limit stored in Postgres (owner decision: no Upstash).
 * Records the call when allowed. Returns false when the user is over the limit.
 */
export async function checkRateLimit(userId: string, route: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.route, route),
        gt(usageEvents.createdAt, sql`now() - ${`${windowSeconds} seconds`}::interval`),
      ),
    );
  if ((row?.n ?? 0) >= limit) return false;
  await db.insert(usageEvents).values({ userId, route });
  return true;
}
