import { MakeTime } from "astronomy-engine";
import { houseFromSign } from "./houses";
import { signOf } from "./math";
import { siderealLongitude } from "./positions";
import type { Planet } from "./tables/planets";

export const GOCHAR_PLANETS = ["Saturn", "Jupiter", "Rahu", "Ketu"] as const;

export interface Transit {
  planet: Planet;
  sign: number;
  longitude: number;
  houseFromMoon: number;
  houseFromLagna?: number;
}

export function transits(at: Date, natalMoonSign: number, natalLagnaSign?: number): Transit[] {
  const t = MakeTime(at);
  return GOCHAR_PLANETS.map((planet) => {
    const longitude = siderealLongitude(planet, t);
    const sign = signOf(longitude);
    return {
      planet,
      sign,
      longitude,
      houseFromMoon: houseFromSign(sign, natalMoonSign),
      houseFromLagna: natalLagnaSign === undefined ? undefined : houseFromSign(sign, natalLagnaSign),
    };
  });
}

export type SadeSatiPhase = "rising" | "peak" | "setting";

/**
 * Sade Sati: Saturn transiting the 12th, 1st or 2nd sign from the natal Moon
 * (≈7½ years). Phases: 12th = rising, 1st = peak, 2nd = setting.
 */
export function sadeSatiPhase(saturnSign: number, natalMoonSign: number): SadeSatiPhase | null {
  const h = houseFromSign(saturnSign, natalMoonSign);
  if (h === 12) return "rising";
  if (h === 1) return "peak";
  if (h === 2) return "setting";
  return null;
}

const DAY = 86_400_000;

/** First date after `from` when Saturn enters `targetSign` (searches up to `years`). Day precision. */
export function nextSaturnIngress(from: Date, targetSign: number, years = 32): Date | null {
  const step = 10 * DAY;
  const signAt = (ms: number) => signOf(siderealLongitude("Saturn", MakeTime(new Date(ms))));
  let prev = from.getTime();
  let prevIn = signAt(prev) === targetSign;
  const end = prev + years * 365.25 * DAY;
  for (let t = prev + step; t <= end; t += step) {
    const isIn = signAt(t) === targetSign;
    if (isIn && !prevIn) {
      let lo = prev;
      let hi = t;
      while (hi - lo > DAY) {
        const mid = (lo + hi) / 2;
        if (signAt(mid) === targetSign) hi = mid;
        else lo = mid;
      }
      return new Date(hi);
    }
    prev = t;
    prevIn = isIn;
  }
  return null;
}

export interface SadeSatiStatus {
  active: boolean;
  phase: SadeSatiPhase | null;
  /** When not active: the next date Saturn enters the 12th from the Moon. */
  nextStart: Date | null;
}

export function sadeSati(at: Date, natalMoonSign: number): SadeSatiStatus {
  const saturnSign = signOf(siderealLongitude("Saturn", MakeTime(at)));
  const phase = sadeSatiPhase(saturnSign, natalMoonSign);
  if (phase) return { active: true, phase, nextStart: null };
  return { active: false, phase: null, nextStart: nextSaturnIngress(at, (natalMoonSign + 11) % 12) };
}
