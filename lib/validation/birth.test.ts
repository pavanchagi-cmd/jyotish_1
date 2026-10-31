import { describe, expect, it } from "vitest";
import { maxBirthDate, profileInputSchema } from "./birth";

const valid = {
  fullName: "Ananya Sharma",
  gender: "female",
  date: "1995-08-14",
  time: "06:42",
  timeKnown: true,
  place: { name: "Jaipur, Rajasthan, India", lat: 26.9124, lng: 75.7873 },
  offsetChoice: { kind: "auto" },
  language: "en",
};

describe("profileInputSchema", () => {
  it("accepts the spec example", () => {
    expect(profileInputSchema.safeParse(valid).success).toBe(true);
  });
  it("requires a time when the time is known", () => {
    expect(profileInputSchema.safeParse({ ...valid, time: null }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, time: null, timeKnown: false }).success).toBe(true);
  });
  it("enforces the 1900 lower bound and no future dates", () => {
    expect(profileInputSchema.safeParse({ ...valid, date: "1899-12-31" }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, date: "2999-01-01" }).success).toBe(false);
  });
  it("rejects impossible dates and names out of range", () => {
    expect(profileInputSchema.safeParse({ ...valid, date: "1995-02-30" }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, fullName: "A" }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...valid, fullName: "x".repeat(81) }).success).toBe(false);
  });
  it("allows gender to be left empty", () => {
    expect(profileInputSchema.safeParse({ ...valid, gender: null }).success).toBe(true);
  });
  it("bounds custom offsets", () => {
    expect(profileInputSchema.safeParse({ ...valid, offsetChoice: { kind: "custom", seconds: 21200 } }).success).toBe(true);
    expect(profileInputSchema.safeParse({ ...valid, offsetChoice: { kind: "custom", seconds: 15 * 3600 } }).success).toBe(false);
  });
});

describe("maxBirthDate", () => {
  it("allows today's date in UTC+14", () => {
    expect(maxBirthDate(new Date("2026-10-31T12:00:00Z"))).toBe("2026-11-01");
  });
});
