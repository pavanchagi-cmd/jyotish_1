export type NavIconName = "home" | "kundali" | "match" | "dasha" | "forecast";

export const NAV_ITEMS: ReadonlyArray<{ href: string; label: string; icon: NavIconName }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/kundali", label: "Kundali", icon: "kundali" },
  { href: "/match", label: "Match", icon: "match" },
  { href: "/dasha", label: "Dasha", icon: "dasha" },
  { href: "/forecast", label: "Forecast", icon: "forecast" },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
