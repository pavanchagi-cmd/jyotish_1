import { ENGINE_CONFIG } from "./config";
import { nakshatraOf } from "./nakshatra";
import { VIMSHOTTARI, VIMSHOTTARI_TOTAL_YEARS } from "./tables/dasha";
import type { Planet } from "./tables/planets";

const DAY_MS = 86_400_000;
const yearMs = () => ENGINE_CONFIG.dashaYearDays * DAY_MS;

export interface Period {
  lord: Planet;
  start: Date;
  end: Date;
}

export interface Mahadasha extends Period {
  antardashas: Period[];
}

function cycleFrom(lord: Planet): typeof VIMSHOTTARI {
  const i = VIMSHOTTARI.findIndex((d) => d.lord === lord);
  return [...VIMSHOTTARI.slice(i), ...VIMSHOTTARI.slice(0, i)];
}

/** Antardashas of a mahadasha: same order starting with its own lord, length ∝ lord's years. */
export function antardashas(md: Period): Period[] {
  const span = md.end.getTime() - md.start.getTime();
  let cursor = md.start.getTime();
  return cycleFrom(md.lord).map(({ lord, years }) => {
    // Antardasha length = mahadasha length × (sub-lord years / 120).
    const length = (span * years) / VIMSHOTTARI_TOTAL_YEARS;
    const p = { lord, start: new Date(cursor), end: new Date(cursor + length) };
    cursor += length;
    return p;
  });
}

/**
 * Vimshottari dasha tree for one 120-year cycle starting from the mahadasha
 * running at birth. The first mahadasha starts before birth: the part already
 * "used up" equals the Moon's progress through its nakshatra.
 */
export function vimshottari(moonLongitude: number, birth: Date): { balanceYears: number; mahadashas: Mahadasha[] } {
  const nak = nakshatraOf(moonLongitude);
  const order = cycleFrom(nak.lord);
  const first = order[0]!;
  const elapsedMs = nak.fraction * first.years * yearMs();
  let cursor = birth.getTime() - elapsedMs;
  const mahadashas = order.map(({ lord, years }) => {
    const md: Period = { lord, start: new Date(cursor), end: new Date(cursor + years * yearMs()) };
    cursor = md.end.getTime();
    return { ...md, antardashas: antardashas(md) };
  });
  return { balanceYears: (1 - nak.fraction) * first.years, mahadashas };
}

/** Mahadasha and antardasha running at `at`, or null if outside the computed cycle. */
export function currentDasha(tree: Mahadasha[], at: Date): { mahadasha: Mahadasha; antardasha: Period } | null {
  const t = at.getTime();
  const md = tree.find((m) => m.start.getTime() <= t && t < m.end.getTime());
  if (!md) return null;
  const ad = md.antardashas.find((a) => a.start.getTime() <= t && t < a.end.getTime())!;
  return { mahadasha: md, antardasha: ad };
}

export const DASHA_TOTAL_YEARS = VIMSHOTTARI_TOTAL_YEARS;
