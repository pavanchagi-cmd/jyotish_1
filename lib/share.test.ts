import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { kundaliShareText, whatsAppUrl } from "./share";

describe("WhatsApp share", () => {
  const chart = computeChart({ birthUtc: new Date("1995-08-14T01:12:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: true });

  it("shares signs and the app link only", () => {
    const text = kundaliShareText(chart, "https://jyotish.example");
    expect(text).toContain("Lagna Leo");
    expect(text).toContain("https://jyotish.example");
    expect(text).not.toMatch(/1995|06:42|Jaipur|26\.9/);
  });

  it("leaves out Lagna when the birth time is unknown", () => {
    const c = computeChart({ birthUtc: new Date("1995-08-14T06:30:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: false });
    expect(kundaliShareText(c, "https://x")).not.toContain("Lagna");
  });

  it("builds a wa.me link", () => {
    expect(whatsAppUrl("a b&c")).toBe("https://wa.me/?text=a%20b%26c");
  });
});
