import type { ChartData } from "./chart";
import { currentDasha, type Mahadasha } from "./dasha";
import { sadeSati, transits, type SadeSatiStatus, type Transit } from "./transits";

export function dashaTree(chart: ChartData): Mahadasha[] {
  return chart.dasha.mahadashas.map((m) => ({
    lord: m.lord,
    start: new Date(m.start),
    end: new Date(m.end),
    antardashas: m.antardashas.map((a) => ({ lord: a.lord, start: new Date(a.start), end: new Date(a.end) })),
  }));
}

export interface DashaReport {
  current: {
    mahadasha: { lord: string; start: string; end: string };
    antardasha: { lord: string; start: string; end: string };
    /** 0–1 progress through the antardasha. */
    antardashaProgress: number;
  } | null;
  timeline: { lord: string; start: string; end: string; current: boolean }[];
  transits: Transit[];
  sadeSati: SadeSatiStatus;
  /** Moon moves ~13° a day: dasha dates shift if the birth time is unknown. */
  approximate: boolean;
}

/** Dasha, Gochar and Sade Sati status for the Dasha screen (spec section 7). */
export function dashaReport(chart: ChartData, at: Date): DashaReport {
  const tree = dashaTree(chart);
  const now = currentDasha(tree, at);
  const iso = (d: Date) => d.toISOString();
  const moonSign = chart.planets.Moon.sign;
  return {
    current: now
      ? {
          mahadasha: { lord: now.mahadasha.lord, start: iso(now.mahadasha.start), end: iso(now.mahadasha.end) },
          antardasha: { lord: now.antardasha.lord, start: iso(now.antardasha.start), end: iso(now.antardasha.end) },
          antardashaProgress:
            (at.getTime() - now.antardasha.start.getTime()) / (now.antardasha.end.getTime() - now.antardasha.start.getTime()),
        }
      : null,
    timeline: tree.map((m) => ({ lord: m.lord, start: iso(m.start), end: iso(m.end), current: now?.mahadasha === m })),
    transits: transits(at, moonSign, chart.lagna?.sign),
    sadeSati: sadeSati(at, moonSign),
    approximate: !chart.timeKnown,
  };
}
