import { DateTime } from "luxon";
import { formatOffset } from "@/lib/time/offsets";

interface BirthFields {
  birthLocal: string;
  timeKnown: boolean;
  placeName: string;
  tzIana: string;
  utcOffsetSeconds: number;
}

/** "14 Aug 1995 · 06:42 AM · Jaipur" (design/Kundali.html header). */
export function birthSummary(p: BirthFields, opts: { fullPlace?: boolean } = {}): string {
  const dt = DateTime.fromISO(p.birthLocal);
  const place = opts.fullPlace ? p.placeName : p.placeName.split(",")[0]!.trim();
  return [dt.toFormat("d LLL yyyy"), p.timeKnown ? dt.toFormat("hh:mm a") : "time unknown", place].join(" · ");
}

export function zoneSummary(p: BirthFields): string {
  return `${p.tzIana} · ${formatOffset(p.utcOffsetSeconds)}`;
}
