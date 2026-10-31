/**
 * API + database integration tests. Run against a throwaway Postgres:
 *   TEST_DATABASE_URL=postgres://postgres@localhost:5432/jyotish_test npm test
 * Skipped when TEST_DATABASE_URL is not set. The database is wiped.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUser, resetDatabase } from "./db";

const DB = process.env.TEST_DATABASE_URL;
const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";

let currentUser: string | null = USER_A;
vi.mock("@/lib/supabase/server", () => ({ getUserId: async () => currentUser }));

const jaipur = {
  fullName: "Ananya Sharma",
  gender: "female",
  date: "1995-08-14",
  time: "06:42",
  timeKnown: true,
  place: { name: "Jaipur, Rajasthan, India", lat: 26.9124, lng: 75.7873 },
  offsetChoice: { kind: "auto" },
  language: "en",
  consent: true,
};

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe.skipIf(!DB)("API with Postgres", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
    process.env.NOMINATIM_USER_AGENT = "Jyotish/test (test@example.com)";
    await resetDatabase(DB!);
    await createAuthUser(DB!, USER_A);
    await createAuthUser(DB!, USER_B);
  });

  beforeEach(() => {
    currentUser = USER_A;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe("profiles", () => {
    it("rejects signed-out requests", async () => {
      currentUser = null;
      const { POST } = await import("@/app/api/profiles/route");
      expect((await POST(post(jaipur))).status).toBe(401);
    });

    it("saves the spec example as 01:12 UTC and makes it primary", async () => {
      const { POST } = await import("@/app/api/profiles/route");
      const res = await POST(post(jaipur));
      expect(res.status).toBe(201);
      const { profile } = await res.json();
      expect(profile).toMatchObject({
        birthLocal: "1995-08-14T06:42",
        birthUtc: "1995-08-14T01:12:00.000Z",
        tzIana: "Asia/Kolkata",
        utcOffsetSeconds: 19800,
        tzConfirmed: false,
        isPrimary: true,
      });
      expect(profile).not.toHaveProperty("userId");
    });

    it("saves a second profile as non-primary", async () => {
      const { POST } = await import("@/app/api/profiles/route");
      const res = await POST(post({ ...jaipur, fullName: "Partner Name", gender: "male" }));
      expect((await res.json()).profile.isPrimary).toBe(false);
    });

    it("stores Calcutta Time to the second for a pre-1956 birth", async () => {
      const { POST } = await import("@/app/api/profiles/route");
      const res = await POST(
        post({ ...jaipur, date: "1950-03-10", time: "08:00", place: { name: "Kolkata", lat: 22.5726, lng: 88.3639 }, offsetChoice: { kind: "calcutta" } }),
      );
      const { profile } = await res.json();
      expect(profile).toMatchObject({ utcOffsetSeconds: 21200, tzConfirmed: true, birthUtc: "1950-03-10T02:06:40.000Z" });
    });

    it("refuses Bombay Time after 1955", async () => {
      const { POST } = await import("@/app/api/profiles/route");
      const res = await POST(post({ ...jaipur, offsetChoice: { kind: "bombay" } }));
      expect(res.status).toBe(422);
    });

    it("validates input", async () => {
      const { POST } = await import("@/app/api/profiles/route");
      expect((await POST(post({ ...jaipur, fullName: "A" }))).status).toBe(400);
      const bad = new Request("http://test/api", { method: "POST", body: "not json" });
      expect((await POST(bad)).status).toBe(400);
    });

    it("lets only the owner edit a profile", async () => {
      const { POST } = await import("@/app/api/profiles/route");
      const { PATCH } = await import("@/app/api/profiles/[id]/route");
      const { profile } = await (await POST(post(jaipur))).json();
      const patch = (body: unknown) =>
        PATCH(new Request("http://test", { method: "PATCH", body: JSON.stringify(body) }), { params: Promise.resolve({ id: profile.id }) });

      currentUser = USER_B;
      expect((await patch({ ...jaipur, time: "08:50" })).status).toBe(404);

      currentUser = USER_A;
      const res = await patch({ ...jaipur, time: "08:50" });
      expect(res.status).toBe(200);
      expect((await res.json()).profile.birthUtc).toBe("1995-08-14T03:20:00.000Z");
    });
  });

  describe("places", () => {
    it("resolves the zone and offers pre-1956 offsets", async () => {
      const { POST } = await import("@/app/api/places/resolve/route");
      const res = await POST(post({ lat: 22.5726, lng: 88.3639, date: "1943-06-01", time: "10:00" }));
      const r = await res.json();
      expect(r).toMatchObject({ zone: "Asia/Kolkata", offsetSeconds: 23400, needsOffsetChoice: true });
      expect(r.offsetOptions.map((o: { kind: string }) => o.kind)).toEqual(["auto", "bombay", "calcutta"]);
    });

    it("resolves New York with DST", async () => {
      const { POST } = await import("@/app/api/places/resolve/route");
      const r = await (await POST(post({ lat: 40.7128, lng: -74.006, date: "2000-07-04", time: "09:00" }))).json();
      expect(r).toMatchObject({ zone: "America/New_York", offsetSeconds: -14400, isDst: true, needsOffsetChoice: false });
    });

    it("searches Nominatim once, then serves the cache", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify([
            { osm_type: "node", osm_id: 1, lat: "29.6434", lon: "79.4322", name: "Ranikhet", address: { town: "Ranikhet", state: "Uttarakhand", country: "India", country_code: "in" } },
          ]),
        ),
      );
      vi.stubGlobal("fetch", fetchMock);
      const { POST } = await import("@/app/api/places/search/route");
      const first = await (await POST(post({ q: "Ranikhet" }))).json();
      const second = await (await POST(post({ q: "  ranikhet " }))).json();
      expect(first.results[0]).toMatchObject({ name: "Ranikhet", admin1: "Uttarakhand", countryCode: "IN", source: "nominatim" });
      expect(second).toEqual(first);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });
  });

  describe("throttle and rate limit", () => {
    it("spaces calls at least 1 second apart across callers", async () => {
      const { waitForSlot } = await import("@/lib/db/throttle");
      const t0 = Date.now();
      await waitForSlot("test-throttle", 1000, 5000);
      await waitForSlot("test-throttle", 1000, 5000);
      await waitForSlot("test-throttle", 1000, 5000);
      expect(Date.now() - t0).toBeGreaterThanOrEqual(1900);
    });

    it("refuses when the queue is longer than the max wait", async () => {
      const { waitForSlot, ThrottleBusyError } = await import("@/lib/db/throttle");
      await waitForSlot("test-busy", 1000, 5000);
      await expect(waitForSlot("test-busy", 1000, 100)).rejects.toBeInstanceOf(ThrottleBusyError);
    });

    it("limits calls per user per window", async () => {
      const { checkRateLimit } = await import("@/lib/db/rate-limit");
      expect(await checkRateLimit(USER_B, "test.route", 2, 60)).toBe(true);
      expect(await checkRateLimit(USER_B, "test.route", 2, 60)).toBe(true);
      expect(await checkRateLimit(USER_B, "test.route", 2, 60)).toBe(false);
      expect(await checkRateLimit(USER_A, "test.route", 2, 60)).toBe(true);
    });
  });
});
