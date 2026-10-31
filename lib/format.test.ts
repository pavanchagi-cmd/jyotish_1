import { describe, expect, it } from "vitest";
import { formatTime, initials } from "./format";

describe("format", () => {
  it("formats times in the place's zone", () => {
    expect(formatTime("2026-10-31T00:42:00Z", "Asia/Kolkata")).toBe("6:12 AM");
    expect(formatTime(null, "Asia/Kolkata")).toBe("—");
  });
  it("makes initials", () => {
    expect(initials("Ananya Sharma")).toBe("AS");
    expect(initials("Ravi")).toBe("R");
    expect(initials("  anil kumar  reddy ")).toBe("AR");
  });
});
