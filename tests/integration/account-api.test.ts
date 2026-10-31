/** Consent, language, profile removal and "Delete my data" against Postgres. Skipped without TEST_DATABASE_URL. */
import postgres from "postgres";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUser, resetDatabase } from "./db";

const DB = process.env.TEST_DATABASE_URL;
const USER_A = "00000000-0000-4000-8000-0000000000a3";
const USER_B = "00000000-0000-4000-8000-0000000000b3";
let currentUser: string | null = USER_A;
vi.mock("@/lib/supabase/server", () => ({
  getUserId: async () => currentUser,
  createClient: async () => ({ auth: { signOut: async () => ({}) } }),
}));

const me = {
  fullName: "Account Owner",
  gender: "female",
  date: "1995-08-14",
  time: "06:42",
  timeKnown: true,
  place: { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  offsetChoice: { kind: "auto" },
  language: "en",
  consent: true,
};
const req = (method: string, body?: unknown) =>
  new Request("http://test/api", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

async function count(table: string, userId: string): Promise<number> {
  const sql = postgres(DB!, { max: 1 });
  try {
    const rows =
      table === "charts"
        ? await sql.unsafe(`select count(*)::int as n from charts`)
        : await sql.unsafe(`select count(*)::int as n from ${table} where user_id = $1`, [userId]);
    return rows[0]!.n as number;
  } finally {
    await sql.end();
  }
}

describe.skipIf(!DB)("account with Postgres", () => {
  let primaryId = "";
  let partnerId = "";

  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await resetDatabase(DB!);
    await createAuthUser(DB!, USER_A);
    await createAuthUser(DB!, USER_B);
  });
  beforeEach(() => {
    currentUser = USER_A;
  });

  it("requires consent before saving birth details, and records it", async () => {
    const { POST } = await import("@/app/api/profiles/route");
    expect((await POST(req("POST", { ...me, consent: false }))).status).toBe(400);
    expect(await count("consents", USER_A)).toBe(0);
    const res = await POST(req("POST", me));
    expect(res.status).toBe(201);
    primaryId = (await res.json()).profile.id;
    expect(await count("consents", USER_A)).toBe(1);
    partnerId = (await (await POST(req("POST", { ...me, fullName: "Partner Person", gender: "male" }))).json()).profile.id;
  });

  it("changes the reading language of the user's own profile", async () => {
    const { PUT } = await import("@/app/api/me/language/route");
    expect((await PUT(req("PUT", { language: "kn" }))).status).toBe(200);
    expect((await PUT(req("PUT", { language: "fr" }))).status).toBe(400);
    const { getPrimaryProfile } = await import("@/lib/db/profiles");
    expect((await getPrimaryProfile(USER_A))!.language).toBe("kn");
  });

  it("removes partner profiles but not the user's own", async () => {
    const { DELETE } = await import("@/app/api/profiles/[id]/route");
    const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
    currentUser = USER_B;
    expect((await DELETE(req("DELETE"), ctx(partnerId))).status).toBe(404);
    currentUser = USER_A;
    expect((await DELETE(req("DELETE"), ctx(primaryId))).status).toBe(409);
    expect((await DELETE(req("DELETE"), ctx(partnerId))).status).toBe(204);
    expect(await count("profiles", USER_A)).toBe(1);
  });

  it("deletes everything for the user and nothing for others", async () => {
    currentUser = USER_B;
    const { POST } = await import("@/app/api/profiles/route");
    await POST(req("POST", { ...me, fullName: "Other User" }));
    currentUser = USER_A;
    const { checkRateLimit } = await import("@/lib/db/rate-limit");
    await checkRateLimit(USER_A, "llm", 30, 3600);

    const { DELETE } = await import("@/app/api/me/route");
    const res = await DELETE();
    expect(await res.json()).toEqual({ dataDeleted: true, accountDeleted: false });
    for (const t of ["profiles", "matches", "usage_events", "consents"]) expect(await count(t, USER_A), t).toBe(0);
    // Only user B's one chart is left.
    expect(await count("charts", USER_A)).toBe(1);
    expect(await count("profiles", USER_B)).toBe(1);
    expect(await count("consents", USER_B)).toBe(1);
  });
});
