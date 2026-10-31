import type { NavIconName } from "./nav-items";

/**
 * Nav icons drawn exactly as in /design (line icons, 24px, currentColor).
 * Kept as SVG because lucide-react has no equivalent for the Kundali and Match marks.
 */
export function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    "aria-hidden": true,
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  } as const;

  switch (name) {
    case "home":
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "kundali":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" />
          <path d="M12 3l9 9-9 9-9-9z" />
        </svg>
      );
    case "match":
      return (
        <svg {...common}>
          <circle cx="9" cy="12" r="5" />
          <circle cx="15" cy="12" r="5" />
        </svg>
      );
    case "dasha":
      return (
        <svg {...common} strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "forecast":
      return (
        <svg {...common} strokeLinecap="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
  }
}
