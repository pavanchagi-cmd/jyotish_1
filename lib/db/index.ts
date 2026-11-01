import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/** Lazily created so builds and pages without DB access don't need DATABASE_URL. */
export function getDb() {
  if (!db) {
    // prepare: false is required for Supabase's transaction pooler.
    // One function instance serves several requests at once (page + prefetches),
    // so allow a few connections. Drop idle ones before the instance is frozen,
    // and fail fast instead of hanging if the database can't be reached.
    const client = postgres(serverEnv().DATABASE_URL, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
