import { describe, expect, it } from "vitest";
import { computeBirthInstant, OffsetChoiceError, resolveZoneOffset } from "./resolve";
import { BOMBAY_TIME_SECONDS, CALCUTTA_TIME_SECONDS, formatOffset, parseOffset } from "./offsets";

describe("resolveZoneOffset", () => {
  it("resolves the spec example: Jaipur, 14 Aug 1995 06:42 IST", () => {
    const r = resolveZoneOffset("Asia/Kolkata", "1995-08-14", "06:42");
    expect(r.offsetSeconds).toBe(19800);
    expect(r.zoneAbbreviation).toBe("IST");
    expect(r.isDst).toBe(false);
    expect(r.status).toBe("ok");
    expect(r.needsOffsetChoice).toBe(false);
  });

  it("uses the tz database's +06:30 wartime offset during 1942–45", () => {
    const r = resolveZoneOffset("Asia/Kolkata", "1943-06-01", "12:00");
    expect(r.offsetSeconds).toBe(23400);
    expect(r.offsetLabel).toBe("UTC +06:30");
    expect(r.needsOffsetChoice).toBe(true);
  });

  it("asks for an offset choice for India before 1956 only", () => {
    expect(resolveZoneOffset("Asia/Kolkata", "1955-12-31", "12:00").needsOffsetChoice).toBe(true);
    expect(resolveZoneOffset("Asia/Kolkata", "1956-01-01", "12:00").needsOffsetChoice).toBe(false);
    expect(resolveZoneOffset("Europe/London", "1950-01-01", "12:00").needsOffsetChoice).toBe(false);
  });

  it("reports DST in New York", () => {
    const summer = resolveZoneOffset("America/New_York", "2000-07-04", "09:00");
    expect(summer.offsetSeconds).toBe(-4 * 3600);
    expect(summer.isDst).toBe(true);
    const winter = resolveZoneOffset("America/New_York", "2000-01-04", "09:00");
    expect(winter.offsetSeconds).toBe(-5 * 3600);
    expect(winter.isDst).toBe(false);
  });

  it("flags a time skipped by a DST jump", () => {
    // 2 Apr 2000: New York clocks went from 02:00 to 03:00.
    expect(resolveZoneOffset("America/New_York", "2000-04-02", "02:30").status).toBe("nonexistent");
  });

  it("flags a time that happened twice when clocks went back", () => {
    // 29 Oct 2000: New York clocks went from 02:00 EDT back to 01:00 EST.
    const r = resolveZoneOffset("America/New_York", "2000-10-29", "01:30");
    expect(r.status).toBe("ambiguous");
    expect(new Set([r.offsetSeconds, r.alternativeOffsetSeconds])).toEqual(new Set([-4 * 3600, -5 * 3600]));
  });
});

describe("computeBirthInstant", () => {
  it("converts the spec example to 01:12 UTC", () => {
    const b = computeBirthInstant({ zone: "Asia/Kolkata", date: "1995-08-14", time: "06:42", choice: { kind: "auto" } });
    expect(b.birthUtc.toISOString()).toBe("1995-08-14T01:12:00.000Z");
    expect(b.birthLocal).toBe("1995-08-14T06:42");
    expect(b.utcOffsetSeconds).toBe(19800);
    expect(b.tzConfirmed).toBe(false);
  });

  it("uses noon when the birth time is unknown", () => {
    const b = computeBirthInstant({ zone: "Asia/Kolkata", date: "1995-08-14", time: null, choice: { kind: "auto" } });
    expect(b.birthLocal).toBe("1995-08-14T12:00");
    expect(b.birthUtc.toISOString()).toBe("1995-08-14T06:30:00.000Z");
  });

  it("applies Calcutta Time (+05:53:20) to the second", () => {
    const b = computeBirthInstant({ zone: "Asia/Kolkata", date: "1950-03-10", time: "08:00", choice: { kind: "calcutta" } });
    expect(b.utcOffsetSeconds).toBe(CALCUTTA_TIME_SECONDS);
    expect(b.birthUtc.toISOString()).toBe("1950-03-10T02:06:40.000Z");
    expect(b.tzConfirmed).toBe(true);
  });

  it("applies Bombay Time (+04:51)", () => {
    const b = computeBirthInstant({ zone: "Asia/Kolkata", date: "1950-03-10", time: "08:00", choice: { kind: "bombay" } });
    expect(b.utcOffsetSeconds).toBe(BOMBAY_TIME_SECONDS);
    expect(b.birthUtc.toISOString()).toBe("1950-03-10T03:09:00.000Z");
  });

  it("marks an explicit IST pick for a pre-1956 India birth as confirmed", () => {
    const b = computeBirthInstant({ zone: "Asia/Kolkata", date: "1950-03-10", time: "08:00", choice: { kind: "auto" } });
    expect(b.tzConfirmed).toBe(true);
    expect(b.utcOffsetSeconds).toBe(19800);
  });

  it("rejects Bombay/Calcutta Time outside pre-1956 India", () => {
    expect(() =>
      computeBirthInstant({ zone: "Asia/Kolkata", date: "1960-03-10", time: "08:00", choice: { kind: "bombay" } }),
    ).toThrow(OffsetChoiceError);
  });

  it("accepts a custom offset anywhere", () => {
    const b = computeBirthInstant({ zone: "Europe/London", date: "1980-01-01", time: "00:30", choice: { kind: "custom", seconds: 3600 } });
    expect(b.birthUtc.toISOString()).toBe("1979-12-31T23:30:00.000Z");
    expect(b.tzConfirmed).toBe(true);
  });

  it("refuses a non-existent local time unless the offset is entered", () => {
    expect(() =>
      computeBirthInstant({ zone: "America/New_York", date: "2000-04-02", time: "02:30", choice: { kind: "auto" } }),
    ).toThrow(OffsetChoiceError);
  });
});

describe("offset helpers", () => {
  it("formats offsets", () => {
    expect(formatOffset(19800)).toBe("UTC +05:30");
    expect(formatOffset(CALCUTTA_TIME_SECONDS)).toBe("UTC +05:53:20");
    expect(formatOffset(-18000)).toBe("UTC −05:00");
  });
  it("parses offsets", () => {
    expect(parseOffset("+05:30")).toBe(19800);
    expect(parseOffset("5:53:20")).toBe(CALCUTTA_TIME_SECONDS);
    expect(parseOffset("-04:00")).toBe(-14400);
    expect(parseOffset("+0451")).toBe(BOMBAY_TIME_SECONDS);
    expect(parseOffset("+15:00")).toBeNull();
    expect(parseOffset("abc")).toBeNull();
    expect(parseOffset("+05:75")).toBeNull();
  });
});
