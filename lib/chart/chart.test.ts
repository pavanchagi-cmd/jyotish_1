import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { northGeometry, southGeometry } from "./geometry";
import { availableDivisions, chartView } from "./view";

const known = computeChart({ birthUtc: new Date("1995-08-14T01:12:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: true });
const unknown = computeChart({ birthUtc: new Date("1995-08-14T06:30:00Z"), lat: 26.9124, lng: 75.7873, timeKnown: false });

describe("chartView", () => {
  it("offers D1, D9 and Moon with a birth time, only Moon without", () => {
    expect(availableDivisions(known)).toEqual(["D1", "D9", "moon"]);
    expect(availableDivisions(unknown)).toEqual(["moon"]);
    expect(chartView(unknown, "D1")).toBeNull();
    expect(chartView(unknown, "D9")).toBeNull();
  });

  it("places all nine planets once", () => {
    for (const div of ["D1", "D9", "moon"] as const) {
      const v = chartView(known, div)!;
      expect(v.bySign.flat()).toHaveLength(9);
    }
  });

  it("starts the D1 at the Lagna and the Moon chart at the Moon sign", () => {
    expect(chartView(known, "D1")!.firstHouseSign).toBe(known.lagna!.sign);
    expect(chartView(known, "moon")!.firstHouseSign).toBe(known.planets.Moon.sign);
    expect(chartView(known, "D9")!.firstHouseSign).toBe(known.d9!.lagnaSign);
  });
});

describe("north geometry", () => {
  const g = northGeometry(chartView(known, "D1")!);
  const labels = g.texts.filter((t) => t.role === "label");

  it("writes the Lagna sign number in house 1 at the top centre", () => {
    expect(labels).toHaveLength(12);
    expect(labels[0]).toMatchObject({ x: 150, y: 128, text: String(known.lagna!.sign + 1) });
  });

  it("runs houses anticlockwise: house 2 top-left, house 4 left, house 10 right", () => {
    const n = (h: number) => String(((known.lagna!.sign + h - 1) % 12) + 1);
    expect(labels[1]).toMatchObject({ x: 75, y: 60, text: n(2) });
    expect(labels[3]).toMatchObject({ x: 128, y: 154, text: n(4) });
    expect(labels[9]).toMatchObject({ x: 172, y: 154, text: n(10) });
  });

  it("marks the ascendant in house 1 and draws every planet", () => {
    expect(g.texts.filter((t) => t.role === "asc").map((t) => t.text)).toEqual(["Asc"]);
    const planetText = g.texts.filter((t) => t.role === "planet").map((t) => t.text).join(" ");
    for (const s of ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]) expect(planetText).toContain(s);
  });

  it("describes the chart for screen readers", () => {
    expect(g.description).toContain("House 1: Leo, Ascendant");
  });
});

describe("south geometry", () => {
  it("puts Pisces top-left and Aries next to it", () => {
    const g = southGeometry(chartView(known, "D1")!);
    const labels = g.texts.filter((t) => t.role === "label");
    expect(labels[11]).toMatchObject({ x: 6, y: 13, text: "Pis" });
    expect(labels[0]).toMatchObject({ x: 81, y: 13, text: "Ari" });
    expect(labels[5]).toMatchObject({ text: "Vir", x: 231, y: 238 });
  });
  it("marks the Lagna cell", () => {
    const g = southGeometry(chartView(known, "D1")!);
    expect(g.texts.filter((t) => t.role === "asc")).toHaveLength(1);
    expect(g.paths).toHaveLength(4);
  });
});

describe("geometryToSvg", () => {
  it("produces a standalone, escaped SVG document", async () => {
    const { geometryToSvg } = await import("./svg-string");
    const svg = geometryToSvg(northGeometry(chartView(known, "D1")!), "Chart <test> & more");
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain("<title>Chart &lt;test&gt; &amp; more</title>");
    expect(svg.match(/<text /g)).toHaveLength(northGeometry(chartView(known, "D1")!).texts.length);
  });
});
