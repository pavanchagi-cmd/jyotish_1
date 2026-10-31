import { describe, expect, it } from "vitest";
import { finaliseForecast, forecastYears } from "./forecast";
import { forecastYearSchema, HEALTH_DISCLAIMER } from "./schemas";

const area = { rating: 3, label: "Steady", summary: "Things move slowly.", example: "Example: a monthly SIP.", tip: "Keep a budget." };
const sample = { year: 1999, headline: "A steady year", why: "Jupiter period.", areas: { career: area, finance: area, family: area, health: area, marriage: area } };

describe("forecast", () => {
  it("shows the current year and the next four, in the place's zone", () => {
    expect(forecastYears(new Date("2026-12-31T20:00:00Z"), "Asia/Kolkata")).toEqual([2027, 2028, 2029, 2030, 2031]);
    expect(forecastYears(new Date("2026-12-31T20:00:00Z"), "America/New_York")).toEqual([2026, 2027, 2028, 2029, 2030]);
  });
  it("forces the requested year and ends health text with the disclaimer, once", () => {
    const f = finaliseForecast(2027, sample);
    expect(f.year).toBe(2027);
    expect(f.areas.health.summary.endsWith(HEALTH_DISCLAIMER)).toBe(true);
    expect(finaliseForecast(2027, f).areas.health.summary.split(HEALTH_DISCLAIMER)).toHaveLength(2);
    expect(f.areas.career.summary).toBe("Things move slowly.");
  });
  it("validates ratings 1–5 and all five areas", () => {
    expect(forecastYearSchema.safeParse(sample).success).toBe(true);
    expect(forecastYearSchema.safeParse({ ...sample, areas: { ...sample.areas, career: { ...area, rating: 6 } } }).success).toBe(false);
    const four = { career: area, finance: area, family: area, health: area };
    expect(forecastYearSchema.safeParse({ ...sample, areas: four }).success).toBe(false);
  });
});
