import { describe, expect, it } from "vitest";
import { profileColumns } from "./compute";
import type { ProfileInput } from "@/lib/validation/birth";

const base: ProfileInput = {
  fullName: "Ananya Sharma",
  gender: "female",
  date: "1995-08-14",
  time: "06:42",
  timeKnown: true,
  place: { name: "Jaipur, Rajasthan, India", lat: 26.9124, lng: 75.7873 },
  offsetChoice: { kind: "auto" },
  language: "en",
};

describe("profileColumns", () => {
  it("stores the spec example as 01:12 UTC", () => {
    const c = profileColumns(base, "Asia/Kolkata");
    expect(c.birthUtc.toISOString()).toBe("1995-08-14T01:12:00.000Z");
    expect(c).toMatchObject({ birthLocal: "1995-08-14T06:42", tzIana: "Asia/Kolkata", utcOffsetSeconds: 19800, tzConfirmed: false });
  });

  it("ignores a stray time when the time is unknown", () => {
    const c = profileColumns({ ...base, timeKnown: false, time: "06:42" }, "Asia/Kolkata");
    expect(c.birthLocal).toBe("1995-08-14T12:00");
    expect(c.timeKnown).toBe(false);
  });
});
