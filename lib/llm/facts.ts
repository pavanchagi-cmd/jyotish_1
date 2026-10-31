import { createHash } from "node:crypto";
import { MakeTime } from "astronomy-engine";
import type { ChartData } from "@/lib/astro/chart";
import type { DashaReport } from "@/lib/astro/dasha-summary";
import { houseFromSign } from "@/lib/astro/houses";
import type { MatchResult } from "@/lib/astro/matching";
import { signOf } from "@/lib/astro/math";
import { nakshatraOf } from "@/lib/astro/nakshatra";
import { siderealLongitude } from "@/lib/astro/positions";
import { KOOTA_MAX } from "@/lib/astro/tables/koota";
import { PLANETS } from "@/lib/astro/tables/planets";
import { SIGNS } from "@/lib/astro/tables/signs";
import type { Period } from "./periods";

/**
 * Facts builders: the ONLY data sent to Gemini. Derived values only — no names,
 * birth date, time or place (spec sections 6 and 9).
 */
const signName = (i: number) => SIGNS[i]!.en;

/** Stable hash of facts for the reading cache key. */
export function factsHash(facts: unknown): string {
  const stable = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])]))
        : v;
  return createHash("sha256").update(JSON.stringify(stable(facts))).digest("hex").slice(0, 32);
}

/**
 * Horoscope facts for a Moon sign (+ Lagna when known). Shared by everyone with
 * the same signs (owner decision), so nothing personal goes in.
 */
export function horoscopeFacts(args: {
  period: Period;
  periodLabel: string;
  moonSign: number;
  lagnaSign?: number;
  /** Midpoint of the period: where the planets are. */
  at: Date;
}) {
  const t = MakeTime(args.at);
  const transits = PLANETS.map((p) => {
    const sign = signOf(siderealLongitude(p, t));
    return {
      planet: p,
      sign: signName(sign),
      houseFromMoon: houseFromSign(sign, args.moonSign),
      ...(args.lagnaSign !== undefined ? { houseFromLagna: houseFromSign(sign, args.lagnaSign) } : {}),
    };
  });
  const moonNow = nakshatraOf(siderealLongitude("Moon", t));
  return {
    period: args.period,
    periodLabel: args.periodLabel,
    natalMoonSign: signName(args.moonSign),
    natalLagnaSign: args.lagnaSign !== undefined ? signName(args.lagnaSign) : null,
    transits,
    ...(args.period === "day" ? { moonNakshatraToday: moonNow.name } : {}),
  };
}

export function kundaliFacts(chart: ChartData) {
  return {
    birthTimeKnown: chart.timeKnown,
    lagna: chart.lagna ? { sign: signName(chart.lagna.sign), nakshatra: chart.lagna.nakshatra.name } : null,
    moon: { sign: signName(chart.planets.Moon.sign), nakshatra: chart.planets.Moon.nakshatra.name, pada: chart.planets.Moon.nakshatra.pada },
    planets: PLANETS.map((p) => ({
      planet: p,
      sign: signName(chart.planets[p].sign),
      ...(chart.planets[p].house ? { house: chart.planets[p].house } : { houseFromMoon: chart.planets[p].houseFromMoon }),
      retrograde: p !== "Rahu" && p !== "Ketu" ? chart.planets[p].retrograde : undefined,
    })),
  };
}

export function dashaFacts(report: DashaReport) {
  const ym = (iso: string) => iso.slice(0, 7);
  return {
    approximate: report.approximate,
    mahadasha: report.current ? { lord: report.current.mahadasha.lord, from: ym(report.current.mahadasha.start), to: ym(report.current.mahadasha.end) } : null,
    antardasha: report.current
      ? { lord: report.current.antardasha.lord, from: ym(report.current.antardasha.start), to: ym(report.current.antardasha.end) }
      : null,
    transits: report.transits.map((t) => ({ planet: t.planet, sign: signName(t.sign), houseFromMoon: t.houseFromMoon })),
    sadeSati: report.sadeSati.active ? { active: true, phase: report.sadeSati.phase } : { active: false },
  };
}

export function matchFacts(result: MatchResult) {
  return {
    total: result.total,
    max: 36,
    kootas: result.kootas.map((k) => ({ name: k.name, points: k.points, max: KOOTA_MAX[k.name] })),
    bhakootDosha: result.doshas.bhakoot.present
      ? { present: true, moonSignDistance: result.doshas.bhakoot.distance, lordsSameOrFriends: result.doshas.bhakoot.lordsSameOrFriends }
      : { present: false },
    nadiDosha: { present: result.doshas.nadi.present },
    manglik: { girl: result.manglik.girl.manglik, boy: result.manglik.boy.manglik },
  };
}
