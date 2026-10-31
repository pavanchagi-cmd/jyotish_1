import { z } from "zod";

/**
 * Public env vars (safe in the browser). Read with literal `process.env.X`
 * so Next.js can inline them at build time.
 */
export function publicEnv() {
  return z
    .object({
      NEXT_PUBLIC_SUPABASE_URL: z.url(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    })
    .parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
}

/** True when Supabase is configured; lets the app build and render before keys exist. */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL_DEEP: z.string().min(1).default("gemini-3.8-flash"),
  GEMINI_MODEL_FAST: z.string().min(1).default("gemini-3.5-flash-lite"),
  NOMINATIM_BASE_URL: z.url().default("https://nominatim.openstreetmap.org"),
  NOMINATIM_USER_AGENT: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Server-only env. Throws a clear error if a required value is missing. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called in the browser");
  }
  return serverSchema.parse(process.env);
}
