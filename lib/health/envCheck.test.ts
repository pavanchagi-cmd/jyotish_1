import { afterEach, describe, expect, it, vi } from "vitest";
import { envCheck } from "./envCheck";

afterEach(() => vi.unstubAllEnvs());

describe("envCheck", () => {
  it("reports true/false only, never values, plus deployment info", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://secret-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-secret-value");
    vi.stubEnv("DATABASE_URL", "postgres://user:pw-secret@host:6543/db");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "claude/jolly-dijkstra-km0ebv");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "43e7bc73e55ca3e23cc7629686b182262fd8bfdd");
    const r = envCheck();
    expect(r).toMatchObject({
      ok: true,
      vercelEnv: "preview",
      gitBranch: "claude/jolly-dijkstra-km0ebv",
      gitCommit: "43e7bc7",
      hint: null,
      variables: { DATABASE_URL: { runtime: true }, NEXT_PUBLIC_SUPABASE_URL: { build: true, runtime: true } },
    });
    const json = JSON.stringify(r);
    for (const secret of ["secret-project", "anon-secret-value", "pw-secret"]) expect(json).not.toContain(secret);
  });

  it("flags missing settings with a hint", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "k");
    vi.stubEnv("DATABASE_URL", "  ");
    const r = envCheck();
    expect(r.ok).toBe(false);
    expect(r.variables.DATABASE_URL).toEqual({ runtime: false });
    expect(r.hint).toMatch(/NEW deployment/);
  });
});
