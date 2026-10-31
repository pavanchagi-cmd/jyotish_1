/** Engine API routes against Postgres. Skipped without TEST_DATABASE_URL (database is wiped). */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUser, resetDatabase } from "./db";

const DB = process.env.TEST_DATABASE_URL;
const USER_A = "00000000-0000-4000-8000-0000000000a1";
const USER_B = "00000000-0000-4000-8000-0000000000b1";
let currentUser: string | null = USER_A;
vi.mock("@/lib/supabase/server", () => ({ getUserId: async () => currentUser }));

const base = {
  gender: "female",
  timeKnown: true,
  offsetChoice: { kind: "auto" },
  language: "en",
  consent: true,
};
const girl = { ...base, fullName: "Girl Example", date: "1995-08-14", time: "06:42", place: { name: "Jaipur", lat: 26.9124, lng: 75.7873 } };
const boy = { ...base, fullName: "Boy Example", gender: "male", date: "1993-02-10", time: "21:15", place: { name: "Bengaluru", lat: 12.9716, lng: 77.5946 } };

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });

async function createProfile(body: unknown): Promise<string> {
  const { POST } = await import("@/app/api/profiles/route");
  const res = await POST(post(body));
  expect(res.status).toBe(201);
  return (await res.json()).profile.id;
}

describe.skipIf(!DB)("engine API with Postgres", () => {
  let girlId = "";
  let boyId = "";

  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
    await resetDatabase(DB!);
    await createAuthUser(DB!, USER_A);
    await createAuthUser(DB!, USER_B);
    currentUser = USER_A;
    girlId = await createProfile(girl);
    boyId = await createProfile(boy);
  });

  beforeEach(() => {
    currentUser = USER_A;
  });

  it("stores a chart when a profile is saved and serves it to the owner only", async () => {
    const { GET } = await import("@/app/api/chart/[profileId]/route");
    const res = await GET(new Request("http://test"), params("profileId", girlId));
    expect(res.status).toBe(200);
    const { chart } = await res.json();
    expect(chart.lagna.sign).toBe(4); // Leo, per the design copy's example
    expect(chart.d9.houses).toHaveLength(12);

    currentUser = USER_B;
    expect((await GET(new Request("http://test"), params("profileId", girlId))).status).toBe(404);
  });

  it("hides Lagna, houses and D9 for an unknown birth time", async () => {
    const id = await createProfile({ ...girl, fullName: "No Time", timeKnown: false, time: null });
    const { GET } = await import("@/app/api/chart/[profileId]/route");
    const { chart } = await (await GET(new Request("http://test"), params("profileId", id))).json();
    expect(chart.lagna).toBeUndefined();
    expect(chart.d1).toBeUndefined();
    expect(chart.d9).toBeUndefined();
    expect(chart.planets.Moon.nakshatra.name).toBeTruthy();
  });

  it("returns dasha, transits and Sade Sati", async () => {
    const { GET } = await import("@/app/api/dasha/[profileId]/route");
    const { NextRequest } = await import("next/server");
    const { dasha } = await (await GET(new NextRequest("http://test/api/dasha"), params("profileId", girlId))).json();
    expect(dasha.current.mahadasha.lord).toBeTruthy();
    expect(dasha.current.antardashaProgress).toBeGreaterThanOrEqual(0);
    expect(dasha.current.antardashaProgress).toBeLessThan(1);
    expect(dasha.timeline).toHaveLength(9);
    expect(dasha.transits.map((t: { planet: string }) => t.planet)).toEqual(["Saturn", "Jupiter", "Rahu", "Ketu"]);
    expect(typeof dasha.sadeSati.active).toBe("boolean");
  });

  it("matches two of the user's own profiles and stores the result", async () => {
    const { POST } = await import("@/app/api/match/route");
    const res = await POST(post({ girlProfileId: girlId, boyProfileId: boyId }));
    expect(res.status).toBe(200);
    const { match } = await res.json();
    expect(match.kootas).toHaveLength(8);
    expect(match.total).toBe(match.kootas.reduce((s: number, k: { points: number }) => s + k.points, 0));
    expect(match.total).toBeGreaterThanOrEqual(0);
    expect(match.total).toBeLessThanOrEqual(36);
    expect(match.id).toMatch(/[0-9a-f-]{36}/);
  });

  it("refuses to match someone else's profiles", async () => {
    currentUser = USER_B;
    const { POST } = await import("@/app/api/match/route");
    expect((await POST(post({ girlProfileId: girlId, boyProfileId: boyId }))).status).toBe(404);
    expect((await POST(post({ girlProfileId: girlId, boyProfileId: girlId }))).status).toBe(400);
  });

  it("computes the Panchang for a place and date", async () => {
    const { GET } = await import("@/app/api/panchang/route");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest("http://test/api/panchang?lat=12.9716&lng=77.5946&date=2026-10-31"));
    const { panchang } = await res.json();
    expect(panchang).toMatchObject({ date: "2026-10-31", zone: "Asia/Kolkata", vara: { name: "Shanivara" } });
    expect(panchang.rahuKaal.start < panchang.rahuKaal.end).toBe(true);
    expect((await GET(new NextRequest("http://test/api/panchang?lat=999&lng=0"))).status).toBe(400);
  });
});
