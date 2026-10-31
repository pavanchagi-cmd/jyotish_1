import { describe, expect, it } from "vitest";
import { birthSummary, zoneSummary } from "./describe";

const p = { birthLocal: "1995-08-14T06:42", timeKnown: true, placeName: "Jaipur, Rajasthan, India", tzIana: "Asia/Kolkata", utcOffsetSeconds: 19800 };

describe("birthSummary", () => {
  it("matches the design header format", () => {
    expect(birthSummary(p)).toBe("14 Aug 1995 · 06:42 AM · Jaipur");
    expect(birthSummary({ ...p, timeKnown: false })).toBe("14 Aug 1995 · time unknown · Jaipur");
    expect(birthSummary(p, { fullPlace: true })).toBe("14 Aug 1995 · 06:42 AM · Jaipur, Rajasthan, India");
  });
  it("describes the zone", () => {
    expect(zoneSummary(p)).toBe("Asia/Kolkata · UTC +05:30");
  });
});
