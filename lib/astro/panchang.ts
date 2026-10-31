import { Body, MakeTime, MoonPhase, Observer, Search, SearchMoonPhase, SearchRiseSet, type AstroTime } from "astronomy-engine";
import { DateTime } from "luxon";
import { diff180, norm360 } from "./math";
import { nakshatraOf } from "./nakshatra";
import { siderealLongitude } from "./positions";
import {
  FIRST_KARANA,
  LAST_KARANAS,
  MOVABLE_KARANAS,
  RAHU_KAAL_PART,
  TITHI_NAMES,
  VARA_NAMES,
  YOGA_NAMES,
} from "./tables/panchang";

const NAK = 360 / 27;

export interface Span {
  start: Date;
  end: Date;
}

export interface PanchangElement {
  index: number;
  name: string;
  /** When this element ends (next one starts). Null if not found within the search window. */
  endsAt: Date | null;
}

export interface Panchang {
  date: string;
  zone: string;
  sunrise: Date | null;
  sunset: Date | null;
  vara: { index: number; name: string };
  tithi: PanchangElement & { paksha: "Shukla" | "Krishna" };
  nakshatra: PanchangElement & { pada: number };
  yoga: PanchangElement;
  karana: PanchangElement;
  rahuKaal: Span | null;
  /** 8th of 15 daytime muhurtas. Traditionally not used on Wednesdays. */
  abhijit: (Span & { avoidOnWednesday: boolean }) | null;
  /** True when panchang elements are taken at sunrise; false when the Sun did not rise (polar day/night). */
  atSunrise: boolean;
}

/** Tithi 1–30 from Moon–Sun elongation. */
export function tithiFromElongation(elongation: number): { number: number; paksha: "Shukla" | "Krishna"; name: string } {
  const n = Math.floor(norm360(elongation) / 12) + 1;
  const paksha = n <= 15 ? "Shukla" : "Krishna";
  const inPaksha = n <= 15 ? n : n - 15;
  const name = n === 15 ? "Purnima" : n === 30 ? "Amavasya" : TITHI_NAMES[inPaksha - 1]!;
  return { number: n, paksha, name };
}

/** Karana 1–60 from elongation (6° each). */
export function karanaFromElongation(elongation: number): { number: number; name: string } {
  const n = Math.floor(norm360(elongation) / 6) + 1;
  let name: string;
  if (n === 1) name = FIRST_KARANA;
  else if (n >= 58) name = LAST_KARANAS[n - 58]!;
  else name = MOVABLE_KARANAS[(n - 2) % 7]!;
  return { number: n, name };
}

export function yogaFromLongitudes(sunSid: number, moonSid: number): { number: number; name: string } {
  const i = Math.floor(norm360(sunSid + moonSid) / NAK);
  return { number: i + 1, name: YOGA_NAMES[i]! };
}

/** Rahu Kaal for a weekday (Sunday = 0) from sunrise and sunset. */
export function rahuKaal(sunrise: Date, sunset: Date, weekday: number): Span {
  const part = (sunset.getTime() - sunrise.getTime()) / 8;
  const k = RAHU_KAAL_PART[weekday]! - 1;
  return { start: new Date(sunrise.getTime() + k * part), end: new Date(sunrise.getTime() + (k + 1) * part) };
}

export function abhijit(sunrise: Date, sunset: Date): Span {
  const m = (sunset.getTime() - sunrise.getTime()) / 15;
  return { start: new Date(sunrise.getTime() + 7 * m), end: new Date(sunrise.getTime() + 8 * m) };
}

const toDate = (t: AstroTime | null) => (t ? t.date : null);

/** Time when an increasing angle f(t) reaches `target` (degrees), searching up to `days`. */
function whenAngleReaches(f: (t: AstroTime) => number, target: number, from: AstroTime, days: number): Date | null {
  return toDate(Search((t) => diff180(f(t), target), from, from.AddDays(days), { dt_tolerance_seconds: 30 }));
}

/**
 * Panchang for a local calendar date at a place. Elements are taken at local
 * sunrise (owner decision), each with its end time.
 */
export function panchang(date: string, lat: number, lng: number, zone: string): Panchang {
  const midnight = DateTime.fromISO(date, { zone }).startOf("day");
  if (!midnight.isValid) throw new Error(`Invalid date/zone: ${date} ${zone}`);
  const observer = new Observer(lat, lng, 0);
  const start = MakeTime(midnight.toJSDate());

  const sunriseT = SearchRiseSet(Body.Sun, observer, +1, start, 1);
  const sunsetT = sunriseT ? SearchRiseSet(Body.Sun, observer, -1, sunriseT, 1) : null;
  const sunrise = toDate(sunriseT);
  const sunset = toDate(sunsetT);

  // Elements at sunrise; if the Sun doesn't rise (polar), use local noon.
  const ref = sunriseT ?? MakeTime(midnight.plus({ hours: 12 }).toJSDate());

  const elong = MoonPhase(ref);
  const tithi = tithiFromElongation(elong);
  const karana = karanaFromElongation(elong);
  const moonSid = siderealLongitude("Moon", ref);
  const sunSid = siderealLongitude("Sun", ref);
  const nak = nakshatraOf(moonSid);
  const yoga = yogaFromLongitudes(sunSid, moonSid);

  const weekday = midnight.weekday % 7; // Luxon: Monday = 1 … Sunday = 7 → Sunday = 0

  return {
    date,
    zone,
    sunrise,
    sunset,
    vara: { index: weekday, name: VARA_NAMES[weekday]! },
    tithi: {
      index: tithi.number,
      name: tithi.name,
      paksha: tithi.paksha,
      endsAt: toDate(SearchMoonPhase(norm360(tithi.number * 12), ref, 3)),
    },
    nakshatra: {
      index: nak.index + 1,
      name: nak.name,
      pada: nak.pada,
      endsAt: whenAngleReaches((t) => siderealLongitude("Moon", t), norm360((nak.index + 1) * NAK), ref, 2),
    },
    yoga: {
      index: yoga.number,
      name: yoga.name,
      endsAt: whenAngleReaches(
        (t) => norm360(siderealLongitude("Sun", t) + siderealLongitude("Moon", t)),
        norm360(yoga.number * NAK),
        ref,
        2,
      ),
    },
    karana: {
      index: karana.number,
      name: karana.name,
      endsAt: toDate(SearchMoonPhase(norm360(karana.number * 6), ref, 2)),
    },
    rahuKaal: sunrise && sunset ? rahuKaal(sunrise, sunset, weekday) : null,
    abhijit: sunrise && sunset ? { ...abhijit(sunrise, sunset), avoidOnWednesday: weekday === 3 } : null,
    atSunrise: Boolean(sunriseT),
  };
}
