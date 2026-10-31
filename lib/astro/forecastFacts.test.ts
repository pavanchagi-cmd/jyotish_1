import { describe, expect, it } from "vitest";
import { computeChart } from "./chart";
import { forecastFacts, LIFE_AREA_HOUSES, transitSpells } from "./forecastFacts";

const chart = computeChart({ birthUtc: new Date("1995-08-14T01:12:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: true });

describe("forecastFacts", () => {
  const f = forecastFacts(chart, 2027);

  it("lists the dasha periods that overlap the year, clipped to it", () => {
    expect(f.dashaPeriods.length).toBeGreaterThan(0);
    expect(f.dashaPeriods[0]!.from).toBe("2027-01");
    expect(f.dashaPeriods.at(-1)!.to).toBe("2027-12");
    for (const p of f.dashaPeriods) expect(p.from <= p.to).toBe(true);
  });

  it("covers every month for each slow planet", () => {
    for (const planet of ["Saturn", "Jupiter", "Rahu", "Ketu"]) {
      const spells = f.transits.filter((t) => t.planet === planet);
      expect(spells[0]!.from).toBe("2027-01");
      expect(spells.at(-1)!.to).toBe("2027-12");
    }
  });

  it("maps life areas to the spec's houses", () => {
    expect(LIFE_AREA_HOUSES).toEqual({ career: [10], finance: [2, 11], family: [4], health: [6, 1], marriage: [7] });
    for (const area of Object.values(f.lifeAreas)) {
      for (const t of area.transitsTouching as { fromMoonHouse?: number; fromLagnaHouse?: number }[]) {
        const h = t.fromMoonHouse ?? t.fromLagnaHouse!;
        expect(area.houses).toContain(h);
      }
    }
  });

  it("leaves out Lagna houses when the birth time is unknown", () => {
    const noTime = computeChart({ birthUtc: new Date("1995-08-14T06:30:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: false });
    const g = forecastFacts(noTime, 2027);
    expect(g.natalLagnaSign).toBeNull();
    expect(g.transits.every((t) => t.houseFromLagna === undefined)).toBe(true);
  });

  it("keeps Rahu and Ketu opposite", () => {
    const s = transitSpells(2027, 0);
    const rahu = s.find((t) => t.planet === "Rahu")!;
    const ketu = s.find((t) => t.planet === "Ketu")!;
    expect((rahu.houseFromMoon - ketu.houseFromMoon + 12) % 12).toBe(6);
  });
});
