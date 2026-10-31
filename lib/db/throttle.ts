import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "./index";

export class ThrottleBusyError extends Error {}

/**
 * Reserves the next slot for an external API, shared by every server instance
 * through Postgres, then waits until that slot. One atomic upsert per call:
 * the stored value is the earliest time the *next* caller may go.
 */
export async function waitForSlot(name: string, intervalMs: number, maxWaitMs: number): Promise<void> {
  const db = getDb();
  const interval = `${intervalMs} milliseconds`;
  const rows = await db.execute<{ wait_ms: number }>(sql`
    insert into external_throttle as t (name, next_slot)
    values (${name}, now() + ${interval}::interval)
    on conflict (name) do update
      set next_slot = greatest(t.next_slot, now()) + ${interval}::interval
    returning greatest(0, extract(epoch from (t.next_slot - ${interval}::interval - now())) * 1000)::float8 as wait_ms
  `);
  const waitMs = Number(rows[0]?.wait_ms ?? 0);
  if (waitMs > maxWaitMs) throw new ThrottleBusyError("Place search is busy. Please try again in a few seconds.");
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
}
