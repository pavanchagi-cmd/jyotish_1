import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps relative paths", () => {
    expect(safeNextPath("/kundali")).toBe("/kundali");
    expect(safeNextPath("/match?x=1")).toBe("/match?x=1");
  });
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });
  it("falls back when empty", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("", "/onboarding")).toBe("/onboarding");
  });
});
