import { ascendant } from "./ascendant";
import { ayanamsaAt } from "./ayanamsa";
import { ENGINE_CONFIG, ENGINE_VERSION } from "./config";
import { vimshottari } from "./dasha";
import { navamsaSign } from "./divisional";
import { houseFromSign, wholeSignHouses, type House } from "./houses";
import { degInSign, signOf } from "./math";
import { nakshatraOf } from "./nakshatra";
import { allPositions } from "./positions";
import { PLANETS, type Planet } from "./tables/planets";

export interface PlanetData {
  longitude: number;
  sign: number;
  degreeInSign: number;
  speed: number;
  retrograde: boolean;
  nakshatra: { index: number; name: string; pada: number; lord: Planet };
  /** Whole-sign house from Lagna; absent when birth time is unknown. */
  house?: number;
  /** House from the Moon sign (Chandra Lagna). */
  houseFromMoon: number;
  navamsaSign: number;
}

export interface ChartData {
  engineVersion: string;
  ayanamsa: { name: string; degrees: number };
  nodeType: string;
  birthUtc: string;
  timeKnown: boolean;
  lagna?: { longitude: number; sign: number; degreeInSign: number; nakshatra: { index: number; name: string; pada: number; lord: Planet } };
  planets: Record<Planet, PlanetData>;
  /** D1 whole-sign houses from Lagna; absent when birth time is unknown. */
  d1?: House[];
  /** D9 Navamsa; absent when birth time is unknown (spec section 4). */
  d9?: { lagnaSign: number; houses: House[] };
  /** Houses counted from the Moon sign. */
  moonChart: House[];
  dasha: {
    balanceYears: number;
    mahadashas: { lord: Planet; start: string; end: string; antardashas: { lord: Planet; start: string; end: string }[] }[];
  };
}

export interface ChartInput {
  birthUtc: Date;
  lat: number;
  lng: number;
  timeKnown: boolean;
}

function nak(lon: number) {
  const n = nakshatraOf(lon);
  return { index: n.index, name: n.name, pada: n.pada, lord: n.lord };
}

/** Full natal chart from a UTC instant and place (all maths, no LLM). */
export function computeChart(input: ChartInput): ChartData {
  const { birthUtc, lat, lng, timeKnown } = input;
  const pos = allPositions(birthUtc);
  const moonSign = signOf(pos.Moon.longitude);
  const asc = timeKnown ? ascendant(birthUtc, lat, lng) : null;
  const lagnaSign = asc ? signOf(asc.longitude) : undefined;

  const planets = Object.fromEntries(
    PLANETS.map((p) => {
      const { longitude, speed, retrograde } = pos[p];
      const sign = signOf(longitude);
      const data: PlanetData = {
        longitude,
        sign,
        degreeInSign: degInSign(longitude),
        speed,
        retrograde,
        nakshatra: nak(longitude),
        houseFromMoon: houseFromSign(sign, moonSign),
        navamsaSign: navamsaSign(longitude),
      };
      if (lagnaSign !== undefined) data.house = houseFromSign(sign, lagnaSign);
      return [p, data];
    }),
  ) as Record<Planet, PlanetData>;

  const signs = Object.fromEntries(PLANETS.map((p) => [p, planets[p].sign])) as Record<Planet, number>;
  const d9Signs = Object.fromEntries(PLANETS.map((p) => [p, planets[p].navamsaSign])) as Record<Planet, number>;
  const tree = vimshottari(pos.Moon.longitude, birthUtc);

  const chart: ChartData = {
    engineVersion: ENGINE_VERSION,
    ayanamsa: { name: ENGINE_CONFIG.ayanamsa, degrees: ayanamsaAt(birthUtc).true },
    nodeType: ENGINE_CONFIG.nodeType,
    birthUtc: birthUtc.toISOString(),
    timeKnown,
    planets,
    moonChart: wholeSignHouses(moonSign, signs),
    dasha: {
      balanceYears: tree.balanceYears,
      mahadashas: tree.mahadashas.map((m) => ({
        lord: m.lord,
        start: m.start.toISOString(),
        end: m.end.toISOString(),
        antardashas: m.antardashas.map((a) => ({ lord: a.lord, start: a.start.toISOString(), end: a.end.toISOString() })),
      })),
    },
  };

  if (asc && lagnaSign !== undefined) {
    const d9Lagna = navamsaSign(asc.longitude);
    chart.lagna = { longitude: asc.longitude, sign: lagnaSign, degreeInSign: degInSign(asc.longitude), nakshatra: nak(asc.longitude) };
    chart.d1 = wholeSignHouses(lagnaSign, signs);
    chart.d9 = { lagnaSign: d9Lagna, houses: wholeSignHouses(d9Lagna, d9Signs) };
  }
  return chart;
}
