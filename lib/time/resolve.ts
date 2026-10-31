import { DateTime } from "luxon";
import {
  BOMBAY_TIME_SECONDS,
  CALCUTTA_TIME_SECONDS,
  type OffsetChoice,
  formatOffset,
  isIndiaPre1956,
} from "./offsets";

/** Noon is used when the birth time is unknown (spec section 4). */
export const UNKNOWN_TIME = "12:00";
export const MIN_BIRTH_DATE = "1900-01-01";

export type LocalTimeStatus =
  /** The wall-clock time exists exactly once. */
  | "ok"
  /** Clocks jumped forward over this time (DST gap); it never happened. */
  | "nonexistent"
  /** Clocks went back, so this time happened twice. */
  | "ambiguous";

export interface ZoneResolution {
  zone: string;
  /** Offset the tz database gives for this local time, in seconds. */
  offsetSeconds: number;
  offsetLabel: string;
  /** Short name such as "IST", "EDT", or "Madras Time" where we know it. */
  zoneAbbreviation: string;
  isDst: boolean;
  status: LocalTimeStatus;
  /** For "ambiguous": the other valid offset. */
  alternativeOffsetSeconds?: number;
  /** True for births in India before 1956: the user must pick the offset. */
  needsOffsetChoice: boolean;
}

export interface BirthInstant {
  /** "YYYY-MM-DDTHH:mm", local wall clock as entered (noon if time unknown). */
  birthLocal: string;
  birthUtc: Date;
  utcOffsetSeconds: number;
  /** True when the user explicitly chose or edited the offset. */
  tzConfirmed: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  return DateTime.fromISO(date, { zone: "utc" }).isValid;
}

export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

/** Local wall-clock time + fixed offset → UTC. Works with second-level offsets. */
export function localToUtc(date: string, time: string, offsetSeconds: number): Date {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - offsetSeconds * 1000);
}

function abbreviationFor(zone: string, offsetSeconds: number, dt: DateTime): string {
  if (zone === "Asia/Kolkata") {
    if (offsetSeconds === 19800) return "IST";
    if (offsetSeconds === 23400) return "IST (wartime)";
    // tz database: Madras Time, used as Indian railway time until 1906.
    if (offsetSeconds === 19270) return "Madras Time";
  }
  return dt.offsetNameShort ?? zone;
}

/**
 * Looks up the tz-database offset for a local date-time in an IANA zone,
 * flagging DST gaps and overlaps so the UI can ask the user.
 */
export function resolveZoneOffset(zone: string, date: string, time: string): ZoneResolution {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  const dt = DateTime.fromObject({ year: y, month: mo, day: d, hour: h, minute: mi }, { zone });
  if (!dt.isValid) throw new Error(`Invalid zone or date: ${zone} ${date} ${time}`);

  // Luxon offsets are minutes and may be fractional (e.g. Madras Time +5:21:10).
  const offsetSeconds = Math.round(dt.offset * 60);
  let status: LocalTimeStatus = "ok";
  let alternativeOffsetSeconds: number | undefined;

  if (dt.hour !== h || dt.minute !== mi) {
    status = "nonexistent";
  } else {
    // Check whether another offset in use around this moment maps to the same wall time.
    const nearby = new Set(
      [dt.minus({ hours: 26 }), dt.plus({ hours: 26 })].map((x) => Math.round(x.offset * 60)),
    );
    for (const other of nearby) {
      if (other === offsetSeconds) continue;
      const utc = localToUtc(date, time, other);
      const back = DateTime.fromJSDate(utc, { zone });
      if (back.hour === h && back.minute === mi && back.day === d) {
        status = "ambiguous";
        alternativeOffsetSeconds = other;
      }
    }
  }

  return {
    zone,
    offsetSeconds,
    offsetLabel: formatOffset(offsetSeconds),
    zoneAbbreviation: abbreviationFor(zone, offsetSeconds, dt),
    isDst: dt.isInDST,
    status,
    alternativeOffsetSeconds,
    needsOffsetChoice: isIndiaPre1956(zone, date),
  };
}

export class OffsetChoiceError extends Error {}

/**
 * Applies the user's offset choice and returns the UTC birth instant.
 * The server always recomputes this; it never trusts a UTC value from the client.
 */
export function computeBirthInstant(args: {
  zone: string;
  date: string;
  time: string | null;
  choice: OffsetChoice;
}): BirthInstant {
  const time = args.time ?? UNKNOWN_TIME;
  const resolution = resolveZoneOffset(args.zone, args.date, time);
  const { choice } = args;

  let offset: number;
  let confirmed: boolean;
  switch (choice.kind) {
    case "auto":
      if (resolution.status === "nonexistent") {
        throw new OffsetChoiceError(
          "This time did not exist on that date because clocks moved forward. Please check the time or enter the offset.",
        );
      }
      offset = resolution.offsetSeconds;
      // A pre-1956 India birth is "confirmed" once the user has picked IST explicitly;
      // the UI sends kind "auto" for the IST option, so we treat that as a choice.
      confirmed = resolution.needsOffsetChoice;
      break;
    case "bombay":
    case "calcutta":
      if (!resolution.needsOffsetChoice) {
        throw new OffsetChoiceError("Bombay and Calcutta Time apply only to births in India before 1956.");
      }
      offset = choice.kind === "bombay" ? BOMBAY_TIME_SECONDS : CALCUTTA_TIME_SECONDS;
      confirmed = true;
      break;
    case "custom":
      offset = choice.seconds;
      confirmed = true;
      break;
  }

  return {
    birthLocal: `${args.date}T${time}`,
    birthUtc: localToUtc(args.date, time, offset),
    utcOffsetSeconds: offset,
    tzConfirmed: confirmed,
  };
}
