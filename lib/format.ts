/** "6:12 AM" in the given IANA zone. */
export function formatTime(iso: string | Date | null | undefined, zone: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso))
    .replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toUpperCase()}`);
}

/** "Sat 6:12 AM" — used for end times that may fall on the next day. */
export function formatDayTime(iso: string | Date | null | undefined, zone: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-IN", { timeZone: zone, weekday: "short" }).format(d);
  return `${day} ${formatTime(d, zone)}`;
}

/** "AS" from "Ananya Sharma". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}
