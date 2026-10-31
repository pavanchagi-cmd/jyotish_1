"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath } from "./nav-items";
import { NavIcon } from "./NavIcon";

/** Five-tab bottom navigation from the design (Home, Kundali, Match, Dasha, Forecast). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 grid grid-cols-5 border-t border-nav-border bg-nav px-1 pt-2 pb-3"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center gap-0.5 text-xs no-underline ${
              active ? "font-semibold text-accent hover:text-accent" : "text-muted hover:text-text"
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
