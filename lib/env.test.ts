import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "./env";

describe("normalizeSupabaseUrl", () => {
  it("strips the REST/auth API path and trailing slashes", () => {
    const base = "https://abc.supabase.co";
    expect(normalizeSupabaseUrl(base)).toBe(base);
    expect(normalizeSupabaseUrl(`${base}/`)).toBe(base);
    expect(normalizeSupabaseUrl(`${base}/rest/v1/`)).toBe(base);
    expect(normalizeSupabaseUrl(`${base}/rest/v1`)).toBe(base);
    expect(normalizeSupabaseUrl(` ${base}/auth/v1 `)).toBe(base);
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined();
  });
});
