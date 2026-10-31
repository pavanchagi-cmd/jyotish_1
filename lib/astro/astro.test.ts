import { MakeTime } from "astronomy-engine";
import { describe, expect, it } from "vitest";
import { lahiriMean } from "./ayanamsa";
import { computeChart } from "./chart";
import { antardashas, currentDasha, vimshottari } from "./dasha";
import { navamsaSign } from "./divisional";
import { houseFromSign, wholeSignHouses } from "./houses";
import { nakshatraOf } from "./nakshatra";
import { planetPosition } from "./positions";
import { VIMSHOTTARI } from "./tables/dasha";
import { NAKSHATRAS } from "./tables/nakshatras";
import { NATURAL_FRIENDSHIP, SEVEN_GRAHAS } from "./tables/planets";
import { sadeSatiPhase } from "./transits";

const JAIPUR = { lat: 26.9124, lng: 75.7873 };
const YEAR_MS = 365.25 * 86_400_000;

describe("ayanamsa", () => {
  it("is about 23°51′ (mean) at J2000", () => {
    // Sanity range only; exact values come from the owner's golden charts.
    const v = lahiriMean(MakeTime(new Date("2000-01-01T12:00:00Z")));
    expect(v).toBeGreaterThan(23.84);
    expect(v).toBeLessThan(23.87);
  });
  it("grows about 50.3″ per year", () => {
    const a = lahiriMean(MakeTime(new Date("2000-01-01T12:00:00Z")));
    const b = lahiriMean(MakeTime(new Date("2001-01-01T12:00:00Z")));
    expect((b - a) * 3600).toBeCloseTo(50.3, 0);
  });
});

describe("positions", () => {
  it("keeps Ketu exactly opposite Rahu, both retrograde", () => {
    const d = new Date("2010-05-05T00:00:00Z");
    const r = planetPosition("Rahu", d);
    const k = planetPosition("Ketu", d);
    expect(Math.abs(((k.longitude - r.longitude + 360) % 360) - 180)).toBeLessThan(1e-9);
    expect(r.retrograde && k.retrograde).toBe(true);
  });
  it("never shows the Sun or Moon retrograde", () => {
    for (const iso of ["1950-01-01", "1995-08-14", "2026-10-31"]) {
      expect(planetPosition("Sun", new Date(iso)).retrograde).toBe(false);
      expect(planetPosition("Moon", new Date(iso)).retrograde).toBe(false);
    }
  });
});

describe("nakshatra", () => {
  it("maps boundaries correctly", () => {
    expect(nakshatraOf(0)).toMatchObject({ index: 0, name: "Ashwini", pada: 1, lord: "Ketu" });
    expect(nakshatraOf(13.3333)).toMatchObject({ index: 0, pada: 4 });
    expect(nakshatraOf(360 / 27)).toMatchObject({ index: 1, name: "Bharani", pada: 1 });
    expect(nakshatraOf(359.999)).toMatchObject({ index: 26, name: "Revati", pada: 4 });
    expect(nakshatraOf(240)).toMatchObject({ name: "Mula", pada: 1 }); // 0° Sagittarius
  });
  it("assigns lords in the Vimshottari cycle", () => {
    const cycle = VIMSHOTTARI.map((d) => d.lord);
    NAKSHATRAS.forEach((n, i) => expect(n.lord).toBe(cycle[i % 9]));
  });
  it("has 9 nakshatras per gana and per nadi", () => {
    for (const g of ["Deva", "Manushya", "Rakshasa"]) expect(NAKSHATRAS.filter((n) => n.gana === g)).toHaveLength(9);
    for (const n of ["Adi", "Madhya", "Antya"]) expect(NAKSHATRAS.filter((x) => x.nadi === n)).toHaveLength(9);
  });
});

describe("houses", () => {
  it("counts whole signs from the first house", () => {
    expect(houseFromSign(4, 4)).toBe(1);
    expect(houseFromSign(3, 4)).toBe(12);
    expect(houseFromSign(10, 4)).toBe(7);
    const houses = wholeSignHouses(4, { Sun: 3, Moon: 8, Mars: 6, Mercury: 4, Jupiter: 7, Venus: 3, Saturn: 10, Rahu: 6, Ketu: 0 });
    expect(houses[0]).toEqual({ house: 1, sign: 4, planets: ["Mercury"] });
    expect(houses[11]!.planets).toEqual(["Sun", "Venus"]);
  });
});

describe("navamsa (D9)", () => {
  /** Classical rule written out independently: movable from itself, fixed from 9th, dual from 5th. */
  function classical(lon: number): number {
    const sign = Math.floor(lon / 30);
    const part = Math.floor((lon % 30) / (30 / 9));
    const start = sign % 3 === 0 ? sign : sign % 3 === 1 ? sign + 8 : sign + 4;
    return (start + part) % 12;
  }
  it("matches the classical movable/fixed/dual rule everywhere", () => {
    for (let lon = 0.01; lon < 360; lon += 0.37) expect(navamsaSign(lon)).toBe(classical(lon));
  });
});

describe("vimshottari dasha", () => {
  it("lasts 120 years in total", () => {
    expect(VIMSHOTTARI.reduce((s, d) => s + d.years, 0)).toBe(120);
    const { mahadashas } = vimshottari(123.4, new Date("1995-08-14T01:12:00Z"));
    const span = mahadashas.at(-1)!.end.getTime() - mahadashas[0]!.start.getTime();
    expect(span / YEAR_MS).toBeCloseTo(120, 6);
  });
  it("starts with the Moon's nakshatra lord and the right balance", () => {
    // Moon at the exact middle of Ashwini (Ketu, 7 years) → 3.5 years left.
    const birth = new Date("2000-01-01T00:00:00Z");
    const r = vimshottari(360 / 54, birth);
    expect(r.mahadashas[0]!.lord).toBe("Ketu");
    expect(r.balanceYears).toBeCloseTo(3.5, 9);
    expect((r.mahadashas[0]!.end.getTime() - birth.getTime()) / YEAR_MS).toBeCloseTo(3.5, 6);
  });
  it("splits each mahadasha into 9 antardashas that fill it exactly", () => {
    const md = { lord: "Moon" as const, start: new Date("2024-01-01T00:00:00Z"), end: new Date(new Date("2024-01-01T00:00:00Z").getTime() + 10 * YEAR_MS) };
    const ads = antardashas(md);
    expect(ads.map((a) => a.lord)).toEqual(["Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun"]);
    expect(ads[0]!.start).toEqual(md.start);
    expect(Math.abs(ads.at(-1)!.end.getTime() - md.end.getTime())).toBeLessThan(2);
    // Moon–Rahu = 10 × 18 / 120 = 1.5 years
    expect((ads[2]!.end.getTime() - ads[2]!.start.getTime()) / YEAR_MS).toBeCloseTo(1.5, 6);
  });
  it("finds the running period", () => {
    const { mahadashas } = vimshottari(200, new Date("1990-01-01T00:00:00Z"));
    const now = currentDasha(mahadashas, new Date("2026-10-31T00:00:00Z"))!;
    expect(now.mahadasha.start.getTime()).toBeLessThanOrEqual(Date.parse("2026-10-31"));
    expect(now.antardasha.end.getTime()).toBeGreaterThan(Date.parse("2026-10-31"));
  });
});

describe("Sade Sati", () => {
  it("covers the 12th, 1st and 2nd signs from the Moon", () => {
    expect(sadeSatiPhase(7, 8)).toBe("rising");
    expect(sadeSatiPhase(8, 8)).toBe("peak");
    expect(sadeSatiPhase(9, 8)).toBe("setting");
    expect(sadeSatiPhase(10, 8)).toBeNull();
    expect(sadeSatiPhase(11, 0)).toBe("rising");
  });
});

describe("friendship table", () => {
  it("lists every other graha exactly once for each graha", () => {
    for (const g of SEVEN_GRAHAS) {
      const r = NATURAL_FRIENDSHIP[g];
      const all = [...r.friends, ...r.neutral, ...r.enemies].sort();
      expect(all).toEqual(SEVEN_GRAHAS.filter((x) => x !== g).sort());
    }
  });
});

describe("computeChart", () => {
  // The design copy (design/Main.html) states: born 06:42 AM in Jaipur → Leo Lagna;
  // 08:50 AM the same day → Virgo. Spec section 4 gives 06:42 IST = 01:12 UTC.
  it("gives Leo Lagna for 14 Aug 1995 06:42 in Jaipur", () => {
    const c = computeChart({ birthUtc: new Date("1995-08-14T01:12:00Z"), ...JAIPUR, timeKnown: true });
    expect(c.lagna?.sign).toBe(4);
    expect(c.d1?.[0]?.sign).toBe(4);
  });
  it("gives Virgo Lagna at 08:50 the same day", () => {
    const c = computeChart({ birthUtc: new Date("1995-08-14T03:20:00Z"), ...JAIPUR, timeKnown: true });
    expect(c.lagna?.sign).toBe(5);
  });
  it("hides Lagna, houses and D9 when the time is unknown", () => {
    const c = computeChart({ birthUtc: new Date("1995-08-14T06:30:00Z"), ...JAIPUR, timeKnown: false });
    expect(c.lagna).toBeUndefined();
    expect(c.d1).toBeUndefined();
    expect(c.d9).toBeUndefined();
    expect(c.planets.Sun.house).toBeUndefined();
    expect(c.moonChart).toHaveLength(12);
    expect(c.dasha.mahadashas).toHaveLength(9);
  });
  it("is serialisable and deterministic", () => {
    const input = { birthUtc: new Date("1995-08-14T01:12:00Z"), ...JAIPUR, timeKnown: true };
    expect(JSON.parse(JSON.stringify(computeChart(input)))).toEqual(JSON.parse(JSON.stringify(computeChart(input))));
  });
});
