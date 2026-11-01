import "server-only";
import postgres from "postgres";
import { getPlaceIndex } from "@/lib/geo";
import { normalizeSupabaseUrl } from "@/lib/env";

/**
 * Setup diagnostics for the owner: which settings are present and whether the
 * database is reachable and migrated. Never returns secret values.
 */
export interface HealthReport {
  ok: boolean;
  environment: string | null;
  settings: Record<string, boolean>;
  supabaseUrl: { ok: boolean; problem?: string };
  database: { ok: boolean; problem?: string; missingTables?: string[] };
  placesList: { ok: boolean; places: number };
}

const REQUIRED_TABLES = ["profiles", "charts", "matches", "readings", "usage_events", "external_throttle", "geocode_cache", "consents"];

/** Turns a driver error into a short, secret-free explanation. */
export function explainDbError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const code = e.code ?? "";
  const msg = (e.message ?? String(err)).replace(/postgres(ql)?:\/\/\S+/gi, "[connection string]");
  if (code === "28P01" || /password authentication failed/i.test(msg))
    return "Wrong database password in DATABASE_URL (28P01). Reset it in Supabase and update DATABASE_URL.";
  if (code === "ENOTFOUND" || /getaddrinfo|ENOTFOUND/i.test(msg))
    return "Database host not found. Copy DATABASE_URL again from Supabase → Connect → Transaction pooler.";
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || /timeout|ECONNREFUSED|ENETUNREACH/i.test(msg))
    return "Could not reach the database. Use the Transaction pooler string (…pooler.supabase.com:6543), not the direct one.";
  if (/Tenant or user not found/i.test(msg))
    return "Supabase pooler says 'Tenant or user not found': the user in DATABASE_URL must be postgres.<project-ref>. Copy it again from Supabase → Connect.";
  if (/Invalid URL|invalid url|ERR_INVALID_URL/i.test(msg))
    return "DATABASE_URL is not a valid URL. Make sure [YOUR-PASSWORD] (with brackets) was replaced and special characters in the password are encoded.";
  return `${code ? `${code}: ` : ""}${msg}`.slice(0, 300);
}

export async function runHealthChecks(): Promise<HealthReport> {
  const env = process.env;
  const settings = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    DATABASE_URL: Boolean(env.DATABASE_URL?.trim()),
    GEMINI_API_KEY: Boolean(env.GEMINI_API_KEY?.trim()),
    NOMINATIM_USER_AGENT: Boolean(env.NOMINATIM_USER_AGENT?.trim()),
  };

  const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const url = normalizeSupabaseUrl(rawUrl);
  const supabaseUrl = !url
    ? { ok: false, problem: "NEXT_PUBLIC_SUPABASE_URL is not set." }
    : /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)
      ? { ok: true }
      : { ok: false, problem: `Expected https://<project-ref>.supabase.co, got a different format.` };

  let database: HealthReport["database"] = { ok: false, problem: "DATABASE_URL is not set." };
  if (env.DATABASE_URL?.trim()) {
    let sql: ReturnType<typeof postgres> | null = null;
    try {
      sql = postgres(env.DATABASE_URL.trim(), { prepare: false, max: 1, connect_timeout: 8, idle_timeout: 1 });
      const rows = await sql<{ name: string; present: boolean }[]>`
        select t as name, to_regclass('public.' || t) is not null as present
        from unnest(${REQUIRED_TABLES}::text[]) as t`;
      const missing = rows.filter((r) => !r.present).map((r) => r.name);
      database = missing.length
        ? {
            ok: false,
            problem: "Connected, but tables are missing. Run drizzle/0000_init.sql, 0001_geocoding.sql and 0002_consents.sql in the Supabase SQL editor, in that order.",
            missingTables: missing,
          }
        : { ok: true };
    } catch (err) {
      database = { ok: false, problem: explainDbError(err) };
    } finally {
      await sql?.end({ timeout: 2 }).catch(() => {});
    }
  }

  let places = 0;
  try {
    places = getPlaceIndex()?.size ?? 0;
  } catch {
    places = 0;
  }

  const placesList = { ok: places > 0, places };
  return {
    ok: settings.NEXT_PUBLIC_SUPABASE_URL && settings.NEXT_PUBLIC_SUPABASE_ANON_KEY && supabaseUrl.ok && database.ok,
    environment: env.VERCEL_ENV ?? null,
    settings,
    supabaseUrl,
    database,
    placesList,
  };
}
