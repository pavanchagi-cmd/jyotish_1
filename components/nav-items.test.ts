import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActivePath } from "./nav-items";

describe("bottom navigation", () => {
  it("has the five tabs from the design, in order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Home", "Kundali", "Match", "Dasha", "Forecast"]);
  });
  it("marks only the matching tab active", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/kundali", "/")).toBe(false);
    expect(isActivePath("/kundali", "/kundali")).toBe(true);
    expect(isActivePath("/kundali/d9", "/kundali")).toBe(true);
    expect(isActivePath("/kundalix", "/kundali")).toBe(false);
  });
});
