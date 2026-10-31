import { useId } from "react";
import type { ChartGeometry } from "@/lib/chart/geometry";

/** Chart colours from the design (Kundali chart card). */
export const CHART_COLORS = {
  paper: "#F6EEDC",
  ink: "#5B3A12",
  label: "#7A5A2E",
  planet: "#2A1A05",
} as const;

/** Renders chart geometry as SVG. Works in the browser and in server-side rendering. */
export function ChartSvg({ geometry, title, standalone = false }: { geometry: ChartGeometry; title: string; standalone?: boolean }) {
  const id = useId();
  return (
    <svg
      xmlns={standalone ? "http://www.w3.org/2000/svg" : undefined}
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
      viewBox="0 0 300 300"
      width={standalone ? 600 : "100%"}
      height={standalone ? 600 : undefined}
      style={{ display: "block" }}
    >
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{geometry.description}</desc>
      {standalone ? <rect width="300" height="300" fill={CHART_COLORS.paper} /> : null}
      {geometry.paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={CHART_COLORS.ink} strokeWidth={i === 0 ? 2 : 1.5} />
      ))}
      <g fontFamily="Hind, 'Noto Sans', sans-serif" textAnchor="middle" dominantBaseline="middle">
        {geometry.texts.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={t.y}
            fontSize={t.size}
            fontWeight={t.bold ? 600 : 400}
            fill={t.role === "label" ? CHART_COLORS.label : t.role === "asc" ? CHART_COLORS.ink : CHART_COLORS.planet}
            textAnchor={t.role === "label" && t.text.length === 3 ? "start" : "middle"}
          >
            {t.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
