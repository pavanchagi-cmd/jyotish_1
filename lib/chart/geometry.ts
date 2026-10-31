import { SIGNS } from "@/lib/astro/tables/signs";
import type { ChartView } from "./view";

/**
 * Renderer-neutral chart drawing: the same geometry feeds the browser SVG and
 * the PDF (spec section 7, "The same SVG feeds the PDF"). 300 × 300 units.
 */
export interface ChartText {
  x: number;
  y: number;
  text: string;
  size: number;
  bold?: boolean;
  /** "label" = sign numbers/names; "planet" = planet marks; "asc" = Lagna marker. */
  role: "label" | "planet" | "asc";
}

export interface ChartGeometry {
  size: 300;
  /** SVG path data, all stroked with the chart ink colour. */
  paths: string[];
  texts: ChartText[];
  /** Accessible summary, e.g. "House 1: Leo, Asc, Mercury. House 2: …" */
  description: string;
}

const PLANET_SIZE = 13;
const LINE = 15;

function planetLines(marks: ChartView["bySign"][number], perLine: number): string[] {
  const words = marks.map((m) => (m.retrograde ? `${m.short}(R)` : m.short));
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += perLine) lines.push(words.slice(i, i + perLine).join(" "));
  return lines;
}

/** Text lines centred vertically around (x, y). */
function stack(x: number, y: number, lines: string[], role: ChartText["role"], size = PLANET_SIZE): ChartText[] {
  const top = y - ((lines.length - 1) * LINE) / 2;
  return lines.map((text, i) => ({ x, y: top + i * LINE, text, size, bold: true, role }));
}

function describe(view: ChartView): string {
  return Array.from({ length: 12 }, (_, i) => {
    const sign = (view.firstHouseSign + i) % 12;
    const parts: string[] = [SIGNS[sign]!.en];
    if (i === 0) parts.push(view.firstHouseLabel === "Asc" ? "Ascendant" : "Moon sign");
    parts.push(...view.bySign[sign]!.map((m) => `${m.planet}${m.retrograde ? " retrograde" : ""}`));
    return `House ${i + 1}: ${parts.join(", ")}.`;
  }).join(" ");
}

// North Indian: house 1 at top centre, houses run anticlockwise. Planet anchors are
// region centroids; sign-number anchors sit near each region's inner corner
// (positions as drawn in design/Kundali.html).
const NORTH_PLANET_AT: [number, number][] = [
  [150, 82], [75, 30], [30, 75], [75, 150], [30, 225], [75, 270],
  [150, 222], [225, 270], [270, 225], [225, 150], [270, 75], [225, 30],
];
const NORTH_SIGN_AT: [number, number][] = [
  [150, 128], [75, 60], [60, 80], [128, 154], [60, 232], [75, 250],
  [150, 186], [225, 250], [240, 232], [172, 154], [240, 80], [225, 60],
];
/** Diamond houses (1, 4, 7, 10) have more room than the triangles. */
const NORTH_PER_LINE = [3, 3, 1, 3, 1, 3, 3, 3, 1, 3, 1, 3];

export function northGeometry(view: ChartView): ChartGeometry {
  const texts: ChartText[] = [];
  for (let h = 0; h < 12; h++) {
    const sign = (view.firstHouseSign + h) % 12;
    const [sx, sy] = NORTH_SIGN_AT[h]!;
    texts.push({ x: sx, y: sy, text: String(sign + 1), size: 11, role: "label" });
    const lines = planetLines(view.bySign[sign]!, NORTH_PER_LINE[h]!);
    const [px, py] = NORTH_PLANET_AT[h]!;
    if (h === 0) {
      const all = [view.firstHouseLabel === "Asc" ? "Asc" : "Moon", ...lines];
      texts.push(...stack(px, py - 12, all, "planet").map((t, i) => (i === 0 ? { ...t, role: "asc" as const } : t)));
    } else {
      texts.push(...stack(px, py, lines, "planet"));
    }
  }
  return {
    size: 300,
    paths: ["M1 1H299V299H1Z", "M0 0L300 300M300 0L0 300", "M150 0L300 150L150 300L0 150Z"],
    texts,
    description: `North Indian style chart, houses anticlockwise from the top. ${describe(view)}`,
  };
}

// South Indian: fixed signs on a 4×4 ring, Pisces top-left, then clockwise.
const SOUTH_CELL: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
]; // index = sign (0 = Aries) → [col, row]

export function southGeometry(view: ChartView): ChartGeometry {
  const c = 75;
  const texts: ChartText[] = [];
  for (let sign = 0; sign < 12; sign++) {
    const [col, row] = SOUTH_CELL[sign]!;
    const x0 = col * c;
    const y0 = row * c;
    texts.push({ x: x0 + 6, y: y0 + 13, text: SIGNS[sign]!.en.slice(0, 3), size: 10, role: "label" });
    const isFirst = sign === view.firstHouseSign;
    const lines = [...(isFirst ? [view.firstHouseLabel === "Asc" ? "Asc" : "Moon"] : []), ...planetLines(view.bySign[sign]!, 3)];
    texts.push(...stack(x0 + c / 2, y0 + c / 2 + 6, lines, "planet").map((t, i) => (isFirst && i === 0 ? { ...t, role: "asc" as const } : t)));
  }
  const [fc, fr] = SOUTH_CELL[view.firstHouseSign]!;
  return {
    size: 300,
    paths: [
      "M1 1H299V299H1Z",
      "M75 0V300M225 0V300M0 75H300M0 225H300",
      "M150 0V75M150 225V300M0 150H75M225 150H300",
      // Lagna (or Moon) cell marked with a corner diagonal, the usual South Indian
      // convention; top-right so it doesn't cross the sign name.
      `M${fc * c + c - 22} ${fr * c}L${fc * c + c} ${fr * c + 22}`,
    ],
    texts,
    description: `South Indian style chart, fixed signs from Pisces at top left. ${describe(view)}`,
  };
}

export function chartGeometry(view: ChartView, style: "north" | "south"): ChartGeometry {
  return style === "north" ? northGeometry(view) : southGeometry(view);
}
