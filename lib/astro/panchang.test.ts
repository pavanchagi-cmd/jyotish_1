import { describe, expect, it } from "vitest";
import { abhijit, karanaFromElongation, panchang, rahuKaal, tithiFromElongation, yogaFromLongitudes } from "./panchang";

describe("tithi", () => {
  it("names tithis by 12° steps", () => {
    expect(tithiFromElongation(0)).toEqual({ number: 1, paksha: "Shukla", name: "Pratipada" });
    expect(tithiFromElongation(170)).toMatchObject({ number: 15, name: "Purnima" });
    expect(tithiFromElongation(180)).toMatchObject({ number: 16, paksha: "Krishna", name: "Pratipada" });
    expect(tithiFromElongation(130)).toMatchObject({ number: 11, name: "Ekadashi" });
    expect(tithiFromElongation(359)).toMatchObject({ number: 30, name: "Amavasya" });
  });
});

describe("karana", () => {
  it("uses fixed karanas at the ends of the month", () => {
    expect(karanaFromElongation(0).name).toBe("Kimstughna");
    expect(karanaFromElongation(6).name).toBe("Bava");
    expect(karanaFromElongation(6 * 7).name).toBe("Vishti"); // karana 8
    expect(karanaFromElongation(6 * 8).name).toBe("Bava"); // karana 9 repeats
    expect(karanaFromElongation(6 * 56).name).toBe("Vishti"); // karana 57
    expect(karanaFromElongation(6 * 57).name).toBe("Shakuni");
    expect(karanaFromElongation(6 * 58).name).toBe("Chatushpada");
    expect(karanaFromElongation(359).name).toBe("Naga");
  });
});

describe("yoga", () => {
  it("steps every 13°20′ of Sun + Moon", () => {
    expect(yogaFromLongitudes(0, 0)).toEqual({ number: 1, name: "Vishkambha" });
    expect(yogaFromLongitudes(200, 159.9)).toMatchObject({ number: 27, name: "Vaidhriti" });
  });
});

describe("Rahu Kaal and Abhijit", () => {
  const rise = new Date("2026-10-31T00:30:00Z");
  const set = new Date("2026-10-31T12:30:00Z"); // 12 h day → 1.5 h parts
  it("uses the weekday's part of the day", () => {
    // Saturday → 3rd part
    expect(rahuKaal(rise, set, 6)).toEqual({ start: new Date("2026-10-31T03:30:00Z"), end: new Date("2026-10-31T05:00:00Z") });
    // Sunday → 8th (last) part
    expect(rahuKaal(rise, set, 0).end).toEqual(set);
    // Monday → 2nd part
    expect(rahuKaal(rise, set, 1).start).toEqual(new Date("2026-10-31T02:00:00Z"));
  });
  it("puts Abhijit around midday (8th of 15 muhurtas)", () => {
    expect(abhijit(rise, set)).toEqual({ start: new Date("2026-10-31T06:06:00Z"), end: new Date("2026-10-31T06:54:00Z") });
  });
});

describe("panchang()", () => {
  const p = panchang("2026-10-31", 12.9716, 77.5946, "Asia/Kolkata");
  it("finds sunrise before sunset on the same local day", () => {
    expect(p.sunrise && p.sunset).toBeTruthy();
    expect(p.sunrise!.getTime()).toBeLessThan(p.sunset!.getTime());
    const localRise = p.sunrise!.toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false });
    expect(Number(localRise)).toBe(6); // Bengaluru sunrise is in the 6 o'clock hour year-round
  });
  it("uses the local weekday (31 Oct 2026 is a Saturday)", () => {
    expect(p.vara).toEqual({ index: 6, name: "Shanivara" });
  });
  it("gives end times after sunrise for each element", () => {
    for (const el of [p.tithi, p.nakshatra, p.yoga, p.karana]) {
      expect(el.endsAt).not.toBeNull();
      expect(el.endsAt!.getTime()).toBeGreaterThan(p.sunrise!.getTime());
    }
  });
  it("puts Rahu Kaal inside daytime", () => {
    expect(p.rahuKaal!.start.getTime()).toBeGreaterThanOrEqual(p.sunrise!.getTime());
    expect(p.rahuKaal!.end.getTime()).toBeLessThanOrEqual(p.sunset!.getTime());
  });
  it("handles polar days without sunrise", () => {
    const polar = panchang("2026-06-21", 78.22, 15.65, "Arctic/Longyearbyen");
    expect(polar.rahuKaal).toBeNull();
    expect(polar.atSunrise).toBe(false);
    expect(polar.tithi.name).toBeTruthy();
  });
});
