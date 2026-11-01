/** /api/health against Postgres. Skipped without TEST_DATABASE_URL (database is wiped). */
import postgres from "postgres";
import { beforeAll, describe, expect, it } from "vitest";
import { resetDatabase } from "./db";

const DB = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB)("health checks with Postgres", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefgh.supabase.co/rest/v1/";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
  });

  it("reports missing tables before migrations run", async () => {
    const sql = postgres(DB!, { max: 1, onnotice: () => {} });
    await sql.unsafe("drop schema if exists public cascade; create schema public;");
    await sql.end();
    process.env.DATABASE_URL = DB;
    const { runHealthChecks } = await import("@/lib/health/checks");
    const r = await runHealthChecks();
    expect(r.ok).toBe(false);
    expect(r.supabaseUrl.ok).toBe(true); // /rest/v1/ is normalised
    expect(r.database.missingTables).toContain("profiles");
    expect(r.database.problem).toMatch(/0000_init\.sql/);
  });

  it("is healthy after migrations", async () => {
    await resetDatabase(DB!);
    const { runHealthChecks } = await import("@/lib/health/checks");
    const r = await runHealthChecks();
    expect(r.database).toEqual({ ok: true });
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r)).not.toContain(DB!);
  });

  it("explains a bad password without echoing it", async () => {
    const u = new URL(DB!);
    u.password = "definitely-wrong-pw";
    u.username = "nobody_here";
    process.env.DATABASE_URL = u.toString();
    const { runHealthChecks } = await import("@/lib/health/checks");
    const r = await runHealthChecks();
    expect(r.database.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain("definitely-wrong-pw");
    process.env.DATABASE_URL = DB;
  });
});
