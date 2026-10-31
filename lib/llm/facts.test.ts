import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { dashaReport } from "@/lib/astro/dasha-summary";
import { ashtakoota } from "@/lib/astro/matching";
import { dashaFacts, factsHash, horoscopeFacts, kundaliFacts, matchFacts } from "./facts";
import { periodKey } from "./periods";

const birth = new Date("1995-08-14T01:12:00Z");
const chart = computeChart({ birthUtc: birth, lat: 26.9124, lng: 75.7873, timeKnown: true });

/** Nothing that identifies the person may reach Gemini (spec sections 6, 9). */
function assertNoPersonalData(facts: unknown) {
  const s = JSON.stringify(facts);
  expect(s).not.toMatch(/1995|01:12|06:42|26\.91|75\.78|Jaipur|birthUtc|lat|lng/);
}

describe("facts", () => {
  it("never include birth date, time, place or coordinates", () => {
    assertNoPersonalData(kundaliFacts(chart));
    assertNoPersonalData(dashaFacts(dashaReport(chart, new Date("2026-10-31T00:00:00Z"))));
    assertNoPersonalData(horoscopeFacts({ period: "day", periodLabel: "2026-10-31", moonSign: 11, lagnaSign: 4, at: new Date("2026-10-31T06:00:00Z") }));
    assertNoPersonalData(matchFacts(ashtakoota({ moon: 100, mars: 10 }, { moon: 200, mars: 20 })));
  });

  it("describe the chart in signs and houses", () => {
    const f = kundaliFacts(chart);
    expect(f.lagna).toEqual({ sign: "Leo", nakshatra: "Magha" });
    expect(f.planets.find((p) => p.planet === "Saturn")).toMatchObject({ sign: "Aquarius", house: 7, retrograde: true });
  });

  it("give horoscope transits relative to Moon and Lagna", () => {
    const f = horoscopeFacts({ period: "week", periodLabel: "2026-W44", moonSign: 11, lagnaSign: 4, at: new Date("2026-10-31T06:00:00Z") });
    expect(f.transits).toHaveLength(9);
    for (const t of f.transits) {
      expect(t.houseFromMoon).toBeGreaterThanOrEqual(1);
      expect(t.houseFromLagna).toBeGreaterThanOrEqual(1);
    }
  });

  it("hash identically regardless of key order", () => {
    expect(factsHash({ a: 1, b: [{ x: 1, y: 2 }] })).toBe(factsHash({ b: [{ y: 2, x: 1 }], a: 1 }));
    expect(factsHash({ a: 1 })).not.toBe(factsHash({ a: 2 }));
  });
});

describe("periodKey", () => {
  const at = new Date("2026-10-31T20:00:00Z"); // 1 Nov 01:30 in India
  it("uses the place's local date", () => {
    expect(periodKey("day", at, "Asia/Kolkata")).toBe("2026-11-01");
    expect(periodKey("day", at, "America/New_York")).toBe("2026-10-31");
  });
  it("uses ISO weeks and calendar months", () => {
    expect(periodKey("week", new Date("2026-10-31T06:00:00Z"), "Asia/Kolkata")).toBe("2026-W44");
    expect(periodKey("week", new Date("2027-01-01T06:00:00Z"), "Asia/Kolkata")).toBe("2026-W53");
    expect(periodKey("month", at, "Asia/Kolkata")).toBe("2026-11");
  });
});
