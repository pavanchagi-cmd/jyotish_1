/** Gemini-backed routes against Postgres with a fake Gemini. Skipped without TEST_DATABASE_URL. */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUser, resetDatabase } from "./db";

const DB = process.env.TEST_DATABASE_URL;
const USER_A = "00000000-0000-4000-8000-0000000000a2";
const USER_B = "00000000-0000-4000-8000-0000000000b2";
let currentUser: string | null = USER_A;
vi.mock("@/lib/supabase/server", () => ({ getUserId: async () => currentUser }));

const profile = {
  fullName: "Reader One",
  gender: "female",
  date: "1995-08-14",
  time: "06:42",
  timeKnown: true,
  place: { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  offsetChoice: { kind: "auto" },
  language: "en",
};

const responses: Record<string, unknown> = {
  horoscope: { title: "A steady day", body: "The Moon supports your 6th house of daily work.", example: "Example: clear one pending bill before lunch." },
  kundali: {
    lagna: { title: "Leo Lagna", meaning: "People see you as warm and confident.", example: "Example: friends ask you to lead the family trip." },
    moon: { title: "Moon in Pisces", meaning: "You feel deeply and care for others.", example: "Example: you notice when a friend is quiet." },
    highlights: [
      { title: "Saturn in the 7th", meaning: "Partnerships grow slowly but last.", example: "Example: a business partner you trust over years." },
      { title: "Jupiter in the 4th", meaning: "Home brings comfort and learning.", example: "Example: a quiet study corner at home helps you." },
    ],
  },
  dasha: {
    currentPeriod: { summary: "Ketu brings reflection; Jupiter adds guidance.", example: "Example: a mentor helps you choose a course." },
    transits: [{ planet: "Saturn", houseFromMoon: 1, meaning: "Take on work steadily and rest well." }],
  },
  match: {
    verdict: "Good match",
    summary: "The total is above the traditional 18.",
    kootaNotes: [],
    doshaNotes: [],
  },
};

let calls = 0;
let failNext = false;
const generateContent = vi.fn(async (req: { contents: string }) => {
  calls++;
  if (failNext) return { text: "nope" };
  const feature = req.contents.startsWith("Write a horoscope")
    ? "horoscope"
    : req.contents.startsWith("Explain this birth chart")
      ? "kundali"
      : req.contents.startsWith("Explain the current Vimshottari")
        ? "dasha"
        : "match";
  return { text: JSON.stringify(responses[feature]), usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 } };
});

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe.skipIf(!DB)("readings with Postgres", () => {
  let idA = "";
  let idB = "";

  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { setGeminiClientForTests } = await import("@/lib/llm/gemini");
    setGeminiClientForTests({ models: { generateContent } } as never);
    await resetDatabase(DB!);
    await createAuthUser(DB!, USER_A);
    await createAuthUser(DB!, USER_B);
    const { POST } = await import("@/app/api/profiles/route");
    currentUser = USER_A;
    idA = (await (await POST(post(profile))).json()).profile.id;
    currentUser = USER_B;
    // Same birth data → same Moon sign and Lagna as user A.
    idB = (await (await POST(post({ ...profile, fullName: "Reader Two" }))).json()).profile.id;
  });

  beforeEach(() => {
    currentUser = USER_A;
    failNext = false;
  });

  afterAll(async () => {
    const { setGeminiClientForTests } = await import("@/lib/llm/gemini");
    setGeminiClientForTests(null);
  });

  const horoscope = async (id: string, period = "day") => {
    const { GET } = await import("@/app/api/horoscope/route");
    const { NextRequest } = await import("next/server");
    return GET(new NextRequest(`http://test/api/horoscope?profileId=${id}&period=${period}`));
  };

  it("generates a horoscope once and serves it from the cache, shared by sign", async () => {
    const before = calls;
    const first = await (await horoscope(idA)).json();
    expect(first.reading).toEqual(responses.horoscope);
    expect(first.cached).toBe(false);
    expect(first.lucky).toMatchObject({ colour: expect.any(String), number: expect.any(Number) });
    expect(first.goodTime.start < first.goodTime.end).toBe(true);

    const again = await (await horoscope(idA)).json();
    expect(again.cached).toBe(true);

    currentUser = USER_B;
    const other = await (await horoscope(idB)).json();
    expect(other.cached).toBe(true); // same Moon sign + Lagna → shared row
    expect(calls - before).toBe(1);
  });

  it("caches each period separately", async () => {
    const before = calls;
    expect((await horoscope(idA, "week")).status).toBe(200);
    expect((await horoscope(idA, "month")).status).toBe(200);
    expect(calls - before).toBe(2);
  });

  it("refuses another user's profile", async () => {
    currentUser = USER_B;
    expect((await horoscope(idA)).status).toBe(404);
  });

  it("explains the Kundali and caches it", async () => {
    const { GET } = await import("@/app/api/chart/[profileId]/explain/route");
    const ctx = { params: Promise.resolve({ profileId: idA }) };
    const before = calls;
    const { explanation } = await (await GET(new Request("http://test"), ctx)).json();
    expect(explanation.lagna.title).toBe("Leo Lagna");
    await GET(new Request("http://test"), ctx);
    expect(calls - before).toBe(1);
  });

  it("adds a dasha summary on request", async () => {
    const { GET } = await import("@/app/api/dasha/[profileId]/route");
    const { NextRequest } = await import("next/server");
    const body = await (await GET(new NextRequest("http://test/api/dasha?summary=1"), { params: Promise.resolve({ profileId: idA }) })).json();
    expect(body.summary.currentPeriod.summary).toContain("Ketu");
    expect(body.dasha.timeline).toHaveLength(9);
  });

  it("summarises a stored match for its owner only", async () => {
    const { POST: create } = await import("@/app/api/profiles/route");
    const boyId = (await (await create(post({ ...profile, fullName: "Partner", gender: "male", date: "1993-02-10", time: "21:15" }))).json()).profile.id;
    const { POST: match } = await import("@/app/api/match/route");
    const { match: m } = await (await match(post({ girlProfileId: idA, boyProfileId: boyId }))).json();
    const { GET } = await import("@/app/api/match/[matchId]/summary/route");
    const ctx = { params: Promise.resolve({ matchId: m.id }) };
    expect((await (await GET(new Request("http://test"), ctx)).json()).summary.verdict).toBe("Good match");
    currentUser = USER_B;
    expect((await GET(new Request("http://test"), ctx)).status).toBe(404);
  });

  it("returns a friendly 503 when Gemini output is unusable twice", async () => {
    failNext = true;
    const { POST: create } = await import("@/app/api/profiles/route");
    const id = (await (await create(post({ ...profile, fullName: "Fresh", date: "2001-01-01" }))).json()).profile.id;
    const res = await horoscope(id);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/try again/);
  });

  it("rate-limits Gemini calls per user (cache hits are free)", async () => {
    const { checkRateLimit } = await import("@/lib/db/rate-limit");
    // Use up user B's hourly allowance.
    for (let i = 0; i < 30; i++) await checkRateLimit(USER_B, "llm", 30, 3600);
    currentUser = USER_B;
    expect((await horoscope(idB)).status).toBe(200); // cached day reading
    expect((await horoscope(idB, "month")).status).toBe(200); // cached by user A's earlier call
    const { GET } = await import("@/app/api/chart/[profileId]/explain/route");
    const res = await GET(new Request("http://test"), { params: Promise.resolve({ profileId: idB }) });
    expect(res.status).toBe(429);
  });
});
