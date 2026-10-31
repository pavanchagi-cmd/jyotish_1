import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

/** Recreates the public schema and applies every migration in /drizzle. */
export async function resetDatabase(url: string): Promise<void> {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe("drop schema if exists public cascade; create schema public;");
    await sql.unsafe(readFileSync("tests/integration/supabase-stub.sql", "utf8"));
    await sql.unsafe("truncate auth.users cascade");
    for (const file of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort()) {
      for (const stmt of readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint")) {
        if (stmt.trim()) await sql.unsafe(stmt);
      }
    }
  } finally {
    await sql.end();
  }
}

export async function createAuthUser(url: string, id: string): Promise<void> {
  const sql = postgres(url, { max: 1 });
  try {
    await sql`insert into auth.users (id) values (${id})`;
  } finally {
    await sql.end();
  }
}
