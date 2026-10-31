import { MakeTime } from "astronomy-engine";
import { DateTime } from "luxon";
import type { ChartData } from "./chart";
import { dashaTree } from "./dasha-summary";
import { houseFromSign } from "./houses";
import { signOf } from "./math";
import { siderealLongitude } from "./positions";
import { GOCHAR_PLANETS } from "./transits";
import { SIGNS } from "./tables/signs";
import type { Planet } from "./tables/planets";

/**
 * Per-year facts for the 5-year forecast (spec sections 5 and 6). Combines the
 * dasha tree with slow-planet transits for one calendar year. Derived facts
 * only — nothing personal.
 */
export const LIFE_AREA_HOUSES = {
  career: [10],
  finance: [2, 11],
  family: [4],
  health: [6, 1],
  marriage: [7],
} as const;
export type LifeArea = keyof typeof LIFE_AREA_HOUSES;

export interface TransitSpell {
  planet: Planet;
  sign: string;
  from: string; // "2027-01"
  to: string; // "2027-12"
  houseFromMoon: number;
  houseFromLagna?: number;
}

const month = (d: DateTime) => d.toFormat("yyyy-LL");

/** Slow-planet sign spells within the year, sampled mid-month (enough for month-level text). */
export function transitSpells(year: number, moonSign: number, lagnaSign?: number): TransitSpell[] {
  const spells: TransitSpell[] = [];
  for (const planet of GOCHAR_PLANETS) {
    let current: TransitSpell | null = null;
    for (let m = 1; m <= 12; m++) {
      const at = DateTime.utc(year, m, 15);
      const sign = signOf(siderealLongitude(planet, MakeTime(at.toJSDate())));
      if (current && current.sign === SIGNS[sign]!.en) {
        current.to = month(at);
        continue;
      }
      current = {
        planet,
        sign: SIGNS[sign]!.en,
        from: month(at),
        to: month(at),
        houseFromMoon: houseFromSign(sign, moonSign),
        ...(lagnaSign !== undefined ? { houseFromLagna: houseFromSign(sign, lagnaSign) } : {}),
      };
      spells.push(current);
    }
  }
  return spells;
}

export function forecastFacts(chart: ChartData, year: number) {
  const start = DateTime.utc(year, 1, 1);
  const end = DateTime.utc(year, 12, 31, 23, 59);
  const ym = (d: Date) => month(DateTime.fromJSDate(d, { zone: "utc" }));

  const periods: { mahadasha: Planet; antardasha: Planet; from: string; to: string }[] = [];
  for (const md of dashaTree(chart)) {
    for (const ad of md.antardashas) {
      if (ad.end.getTime() <= start.toMillis() || ad.start.getTime() > end.toMillis()) continue;
      periods.push({
        mahadasha: md.lord,
        antardasha: ad.lord,
        from: ad.start.getTime() < start.toMillis() ? month(start) : ym(ad.start),
        to: ad.end.getTime() > end.toMillis() ? month(end) : ym(ad.end),
      });
    }
  }

  const lagnaSign = chart.lagna?.sign;
  const transits = transitSpells(year, chart.planets.Moon.sign, lagnaSign);

  const lifeAreas = Object.fromEntries(
    (Object.keys(LIFE_AREA_HOUSES) as LifeArea[]).map((area) => {
      const houses = LIFE_AREA_HOUSES[area] as readonly number[];
      const touching = transits
        .filter((t) => houses.includes(t.houseFromMoon) || (t.houseFromLagna !== undefined && houses.includes(t.houseFromLagna)))
        .map((t) => ({
          planet: t.planet,
          from: t.from,
          to: t.to,
          ...(houses.includes(t.houseFromMoon) ? { fromMoonHouse: t.houseFromMoon } : {}),
          ...(t.houseFromLagna !== undefined && houses.includes(t.houseFromLagna) ? { fromLagnaHouse: t.houseFromLagna } : {}),
        }));
      return [area, { houses, transitsTouching: touching }];
    }),
  ) as Record<LifeArea, { houses: readonly number[]; transitsTouching: unknown[] }>;

  return {
    year,
    birthTimeKnown: chart.timeKnown,
    natalMoonSign: SIGNS[chart.planets.Moon.sign]!.en,
    natalLagnaSign: lagnaSign !== undefined ? SIGNS[lagnaSign]!.en : null,
    dashaPeriods: periods,
    transits,
    lifeAreas,
  };
}
