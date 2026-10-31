import { describe, expect, it } from "vitest";
import { ashtakoota, manglik, taraIsGood } from "./matching";
import { NAKSHATRA_SPAN } from "./tables/nakshatras";
import { YONI_ENEMIES, YONI_ORDER, YONI_POINTS } from "./tables/koota";

/** Moon longitude in the middle of nakshatra `i` (0–26). */
const nakMid = (i: number) => (i + 0.5) * NAKSHATRA_SPAN;

describe("ashtakoota", () => {
  it("keeps every total within 0–36 and equal to the sum of the kootas", () => {
    for (let g = 0; g < 27; g++) {
      for (let b = 0; b < 27; b++) {
        for (const off of [0.2, 0.5, 0.8]) {
          const r = ashtakoota({ moon: (g + off) * NAKSHATRA_SPAN, mars: 10 }, { moon: (b + off) * NAKSHATRA_SPAN, mars: 100 });
          const sum = r.kootas.reduce((s, k) => s + k.points, 0);
          expect(r.total).toBe(sum);
          expect(r.total).toBeGreaterThanOrEqual(0);
          expect(r.total).toBeLessThanOrEqual(36);
          for (const k of r.kootas) {
            expect(k.points).toBeGreaterThanOrEqual(0);
            expect(k.points).toBeLessThanOrEqual(k.max);
          }
        }
      }
    }
  });

  it("flags Nadi dosha for the same nadi", () => {
    // Ashwini and Ardra are both Adi nadi.
    const r = ashtakoota({ moon: nakMid(0), mars: 0 }, { moon: nakMid(5), mars: 0 });
    expect(r.doshas.nadi.present).toBe(true);
    expect(r.kootas.find((k) => k.name === "nadi")!.points).toBe(0);
  });

  it("flags Bhakoot dosha for a 6–8 sign relationship", () => {
    // Girl Moon in Aries (0), boy Moon in Virgo (5): 6th from girl, 8th from boy.
    const r = ashtakoota({ moon: 5, mars: 0 }, { moon: 155, mars: 0 });
    expect(r.doshas.bhakoot.present).toBe(true);
    expect(r.doshas.bhakoot.distance).toEqual([6, 8]);
    expect(r.kootas.find((k) => k.name === "bhakoot")!.points).toBe(0);
  });

  it("gives full Bhakoot for the same sign", () => {
    const r = ashtakoota({ moon: 5, mars: 0 }, { moon: 10, mars: 0 });
    expect(r.kootas.find((k) => k.name === "bhakoot")!.points).toBe(7);
  });
});

describe("tara", () => {
  it("treats counts 3, 5, 7 (mod 9) as inauspicious", () => {
    expect(taraIsGood(0, 0)).toBe(true); // count 1
    expect(taraIsGood(0, 2)).toBe(false); // count 3
    expect(taraIsGood(0, 4)).toBe(false); // count 5
    expect(taraIsGood(0, 6)).toBe(false); // count 7
    expect(taraIsGood(0, 11)).toBe(false); // count 12 → 3
    expect(taraIsGood(0, 8)).toBe(true); // count 9
  });
});

describe("manglik", () => {
  it("checks Mars from Lagna when known, else from the Moon", () => {
    // Lagna Leo (4), Mars Libra (6) → 3rd house: not Manglik.
    expect(manglik({ moon: 250, mars: 190, lagnaSign: 4 })).toMatchObject({ manglik: false, fromLagna: { house: 3 } });
    // Mars in Aquarius (10) from Leo Lagna → 7th: Manglik.
    expect(manglik({ moon: 250, mars: 310, lagnaSign: 4 }).manglik).toBe(true);
    // No Lagna: Moon Sagittarius (8), Mars Pisces (11) → 4th from Moon.
    expect(manglik({ moon: 250, mars: 340 })).toMatchObject({ fromLagna: null, manglik: true, fromMoon: { house: 4 } });
  });
});

describe("koota tables", () => {
  it("Yoni table is symmetric with 4 on the diagonal and 0 for sworn enemies", () => {
    for (let i = 0; i < 14; i++) {
      expect(YONI_POINTS[i]![i]).toBe(4);
      for (let j = 0; j < 14; j++) expect(YONI_POINTS[i]![j]).toBe(YONI_POINTS[j]![i]);
    }
    for (const [a, b] of YONI_ENEMIES) expect(YONI_POINTS[YONI_ORDER.indexOf(a)]![YONI_ORDER.indexOf(b)]).toBe(0);
  });

  // Owner verification against Drik Panchang (spec section 5: tables marked TODO(verify)).
  it.todo("owner verified Vashya points table (lib/astro/tables/koota.ts)");
  it.todo("owner verified Yoni points for non-identical, non-enemy pairs");
  it.todo("owner verified Gana points for Deva–Rakshasa and Manushya–Deva");
  it.todo("owner verified Manglik house set (1, 2, 4, 7, 8, 12)");
  it.todo("owner verified a full Kundali Milan score against Drik Panchang");
});
