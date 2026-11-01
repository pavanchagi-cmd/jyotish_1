/**
 * Which required settings this deployment has, as true/false only (never values).
 *
 * NEXT_PUBLIC_* values are inlined into the code when the app is BUILT, so they
 * are checked twice: "build" is what the build saw (literal process.env.X, which
 * Next.js replaces at build time) and "runtime" is what the running function
 * has now (dynamic lookup, never inlined). DATABASE_URL is runtime-only.
 */
export interface EnvCheck {
  ok: boolean;
  variables: Record<string, { build?: boolean; runtime: boolean }>;
  vercelEnv: string | null;
  gitBranch: string | null;
  gitCommit: string | null;
  deploymentUrl: string | null;
  hint: string | null;
}

const present = (v: string | undefined) => Boolean(v?.trim());

/** Reads a variable at run time; the computed key stops Next.js from inlining it. */
function runtime(name: string): boolean {
  const env: Record<string, string | undefined> = process.env;
  return present(env[name]);
}

export function envCheck(): EnvCheck {
  const variables: EnvCheck["variables"] = {
    NEXT_PUBLIC_SUPABASE_URL: { build: present(process.env.NEXT_PUBLIC_SUPABASE_URL), runtime: runtime("NEXT_PUBLIC_SUPABASE_URL") },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      build: present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      runtime: runtime("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    },
    DATABASE_URL: { runtime: runtime("DATABASE_URL") },
  };
  const ok = Object.values(variables).every((v) => v.runtime && v.build !== false);

  let hint: string | null = null;
  if (!ok) {
    const publicBuiltWithout = Object.values(variables).some((v) => v.build === false && v.runtime);
    hint = publicBuiltWithout
      ? "This deployment's code was built before the NEXT_PUBLIC_ settings existed. Redeploy, then open the NEW deployment's link (each deployment link is a fixed snapshot)."
      : "Settings were missing when this deployment was created. Check they are saved for this environment (vercelEnv), redeploy, then open the NEW deployment's link.";
  }

  return {
    ok,
    variables,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    deploymentUrl: process.env.VERCEL_URL ?? null,
    hint,
  };
}
