import type { ChartGeometry } from "./geometry";

const COLORS = { paper: "#F6EEDC", ink: "#5B3A12", label: "#7A5A2E", planet: "#2A1A05" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Standalone SVG document for the /svg route and image export. */
export function geometryToSvg(g: ChartGeometry, title: string): string {
  const paths = g.paths
    .map((d, i) => `<path d="${esc(d)}" fill="none" stroke="${COLORS.ink}" stroke-width="${i === 0 ? 2 : 1.5}"/>`)
    .join("");
  const texts = g.texts
    .map((t) => {
      const fill = t.role === "label" ? COLORS.label : t.role === "asc" ? COLORS.ink : COLORS.planet;
      const anchor = t.role === "label" && t.text.length === 3 ? "start" : "middle";
      return `<text x="${t.x}" y="${t.y}" font-size="${t.size}" font-weight="${t.bold ? 600 : 400}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle">${esc(t.text)}</text>`;
    })
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="600" height="600" role="img">` +
    `<title>${esc(title)}</title><desc>${esc(g.description)}</desc>` +
    `<rect width="300" height="300" fill="${COLORS.paper}"/>${paths}` +
    `<g font-family="Hind, 'Noto Sans', Arial, sans-serif">${texts}</g></svg>`
  );
}
