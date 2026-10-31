import type { ChartData } from "@/lib/astro/chart";
import { PLANET_NAMES, PLANETS, type Planet } from "@/lib/astro/tables/planets";

export type Division = "D1" | "D9" | "moon";
export type ChartStyle = "north" | "south";

export interface ChartPlanetMark {
  planet: Planet;
  short: string;
  retrograde: boolean;
}

export interface ChartView {
  division: Division;
  /** Sign (0 = Aries) of house 1. */
  firstHouseSign: number;
  /** Label for house 1: "Asc" for D1/D9, "Mo" for the Moon chart. */
  firstHouseLabel: "Asc" | "Moon";
  /** Planets by sign (0–11). */
  bySign: ChartPlanetMark[][];
}

/** Which divisions can be shown: D1 and D9 need a known birth time (spec section 4). */
export function availableDivisions(chart: ChartData): Division[] {
  return chart.lagna ? ["D1", "D9", "moon"] : ["moon"];
}

/** Turns engine output into what a chart drawing needs. Null if the division is unavailable. */
export function chartView(chart: ChartData, division: Division): ChartView | null {
  const bySign: ChartPlanetMark[][] = Array.from({ length: 12 }, () => []);
  const mark = (p: Planet): ChartPlanetMark => ({
    planet: p,
    short: PLANET_NAMES[p].short,
    // Rahu/Ketu are always retrograde; marking them adds noise, so only flag the others.
    retrograde: chart.planets[p].retrograde && p !== "Rahu" && p !== "Ketu",
  });

  if (division === "D9") {
    if (!chart.d9) return null;
    for (const p of PLANETS) bySign[chart.planets[p].navamsaSign]!.push(mark(p));
    return { division, firstHouseSign: chart.d9.lagnaSign, firstHouseLabel: "Asc", bySign };
  }
  for (const p of PLANETS) bySign[chart.planets[p].sign]!.push(mark(p));
  if (division === "D1") {
    if (!chart.lagna) return null;
    return { division, firstHouseSign: chart.lagna.sign, firstHouseLabel: "Asc", bySign };
  }
  return { division, firstHouseSign: chart.planets.Moon.sign, firstHouseLabel: "Moon", bySign };
}

export const DIVISION_LABELS: Record<Division, string> = {
  D1: "Lagna (D1)",
  D9: "Navamsa (D9)",
  moon: "Moon chart",
};
