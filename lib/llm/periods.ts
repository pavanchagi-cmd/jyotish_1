import { DateTime } from "luxon";

export type Period = "day" | "week" | "month";

/** Cache period key in the place's zone: "2026-10-31", "2026-W44", "2026-10" (spec section 6). */
export function periodKey(period: Period, now: Date, zone: string): string {
  const d = DateTime.fromJSDate(now, { zone });
  if (period === "day") return d.toISODate()!;
  if (period === "week") return `${d.weekYear}-W${String(d.weekNumber).padStart(2, "0")}`;
  return d.toFormat("yyyy-LL");
}

/** First and last calendar day of the period (local), for transit facts. */
export function periodRange(period: Period, now: Date, zone: string): { start: DateTime; end: DateTime } {
  const d = DateTime.fromJSDate(now, { zone });
  const unit = period === "day" ? "day" : period === "week" ? "week" : "month";
  return { start: d.startOf(unit), end: d.endOf(unit) };
}
