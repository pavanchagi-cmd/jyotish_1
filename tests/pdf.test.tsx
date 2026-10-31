import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { KundaliPdf } from "@/lib/pdf/KundaliPdf";

describe("KundaliPdf", () => {
  it.each([
    ["with birth time", true],
    ["without birth time", false],
  ])("renders a PDF %s", async (_label, timeKnown) => {
    const chart = computeChart({ birthUtc: new Date("1995-08-14T01:12:00Z"), lat: 26.9124, lng: 75.7873, timeKnown });
    const buf = await renderToBuffer(
      <KundaliPdf name="Test Person" birthLine="14 Aug 1995 · 06:42 AM · Jaipur" zoneLine="Asia/Kolkata · UTC +05:30" chart={chart} style="north" />,
    );
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(3000);
  });
});
