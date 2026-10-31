/**
 * Pre-1956 India offset choices (owner decision, 31 Oct 2026; spec section 4).
 *
 * The IANA tz database has a single zone (Asia/Kolkata) for all of India, so it
 * cannot tell Bombay Time from Calcutta Time. For births in India before
 * 1956-01-01 we ask the user which time their birth record used.
 *
 * Values are the ones the owner specified:
 * - Bombay Time   UTC+04:51
 * - Calcutta Time UTC+05:53:20
 */
export const INDIA_PRE_1956_CUTOFF = "1956-01-01";

export const BOMBAY_TIME_SECONDS = 4 * 3600 + 51 * 60; // 17460
export const CALCUTTA_TIME_SECONDS = 5 * 3600 + 53 * 60 + 20; // 21200

/** Largest offset in use anywhere is +14:00, smallest −12:00. */
export const MAX_OFFSET_SECONDS = 14 * 3600;
export const MIN_OFFSET_SECONDS = -12 * 3600;

export type OffsetChoice =
  | { kind: "auto" }
  | { kind: "bombay" }
  | { kind: "calcutta" }
  | { kind: "custom"; seconds: number };

export function isIndiaPre1956(zone: string, date: string): boolean {
  return zone === "Asia/Kolkata" && date < INDIA_PRE_1956_CUTOFF;
}

/** "UTC +05:30", "UTC +05:53:20", "UTC −04:00" */
export function formatOffset(seconds: number): string {
  const sign = seconds < 0 ? "−" : "+";
  const abs = Math.abs(Math.round(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const hhmm = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `UTC ${sign}${s ? `${hhmm}:${String(s).padStart(2, "0")}` : hhmm}`;
}

/**
 * Parses "+05:30", "-04:00", "5:53:20", "+0530". Returns seconds or null.
 */
export function parseOffset(input: string): number | null {
  const m = /^\s*([+\-−]?)\s*(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?\s*$/.exec(input);
  if (!m) return null;
  const sign = m[1] === "-" || m[1] === "−" ? -1 : 1;
  const h = Number(m[2]);
  const min = Number(m[3] ?? 0);
  const sec = Number(m[4] ?? 0);
  if (min > 59 || sec > 59) return null;
  const total = sign * (h * 3600 + min * 60 + sec);
  if (total > MAX_OFFSET_SECONDS || total < MIN_OFFSET_SECONDS) return null;
  return total;
}
