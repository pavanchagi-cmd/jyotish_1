"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share2 } from "lucide-react";
import type { ChartData } from "@/lib/astro/chart";
import { PLANET_NAMES, PLANETS } from "@/lib/astro/tables/planets";
import { SIGNS } from "@/lib/astro/tables/signs";
import { availableDivisions, chartView, DIVISION_LABELS, type ChartStyle, type Division } from "@/lib/chart/view";
import { kundaliShareText, whatsAppUrl } from "@/lib/share";
import { NorthIndianChart } from "@/components/chart/NorthIndianChart";
import { SouthIndianChart } from "@/components/chart/SouthIndianChart";

const STYLE_KEY = "jyotish.chartStyle";
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function readStyle(): ChartStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === "south" ? "south" : "north";
  } catch {
    return "north";
  }
}

const noop = () => () => {};

export function KundaliView({ profileId, chart }: { profileId: string; chart: ChartData }) {
  const divisions = availableDivisions(chart);
  const [division, setDivision] = useState<Division>(divisions[0]!);
  const storedStyle = useSyncExternalStore(noop, readStyle, () => "north" as ChartStyle);
  const [chosenStyle, setChosenStyle] = useState<ChartStyle | null>(null);
  const style = chosenStyle ?? storedStyle;
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");

  function pickStyle(s: ChartStyle) {
    setChosenStyle(s);
    try {
      localStorage.setItem(STYLE_KEY, s);
    } catch {
      /* storage blocked: keep in memory */
    }
  }

  const view = chartView(chart, division);
  const tabs: Division[] = ["D1", "D9", "moon"];

  return (
    <>
      <div role="tablist" aria-label="Chart type" className="grid grid-cols-3 gap-1.5 rounded-input bg-surface p-1">
        {tabs.map((d) => {
          const enabled = divisions.includes(d);
          const selected = d === division;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="chart-panel"
              disabled={!enabled}
              title={enabled ? undefined : "Needs your exact birth time"}
              onClick={() => setDivision(d)}
              className={`h-11 rounded-[9px] text-sm ${selected ? "bg-accent font-semibold text-accent-ink" : "text-text disabled:text-muted disabled:opacity-60"}`}
            >
              {DIVISION_LABELS[d]}
            </button>
          );
        })}
      </div>

      {!chart.lagna ? (
        <p className="m-0 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm text-warm-soft">
          Your birth time is missing, so readings use your Moon sign only. Lagna, houses and Navamsa need an exact time.
        </p>
      ) : null}

      <div id="chart-panel" role="tabpanel" className="flex flex-col gap-2 rounded-card-lg bg-chart-paper p-3.5">
        {view ? style === "north" ? <NorthIndianChart view={view} /> : <SouthIndianChart view={view} /> : null}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-chart-ink">
            {style === "north" ? "Numbers are zodiac signs (1 = Aries)" : "Signs are fixed; the marked box is house 1"}
          </div>
          <div role="group" aria-label="Chart style" className="flex gap-1">
            {(["north", "south"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={style === s}
                onClick={() => pickStyle(s)}
                className={`min-h-11 rounded-lg border border-chart-ink px-3 text-[13px] ${style === s ? "bg-chart-ink text-chart-paper" : "bg-transparent text-chart-ink"}`}
              >
                {s === "north" ? "North" : "South"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="planets-title" className="flex flex-col gap-1 rounded-card border border-border bg-surface px-4 py-3.5">
        <h2 id="planets-title" className="mt-0 mb-1.5 font-heading text-xl font-bold">
          Planet positions
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th scope="col" className="pb-1.5 font-normal">Planet</th>
              <th scope="col" className="pb-1.5 font-normal">Sign</th>
              <th scope="col" className="pb-1.5 font-normal">{chart.lagna ? "House" : "From Moon"}</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((p, i) => {
              const d = chart.planets[p];
              const name = p === "Rahu" || p === "Ketu" ? p : `${p} (${PLANET_NAMES[p].sa})`;
              return (
                <tr key={p} className={i < PLANETS.length - 1 ? "border-b border-divider" : ""}>
                  <th scope="row" className="py-1.5 text-left font-normal">
                    {name}
                    {d.retrograde && p !== "Rahu" && p !== "Ketu" ? <abbr title="Retrograde" className="ml-1 text-xs text-muted no-underline">R</abbr> : null}
                  </th>
                  <td className="py-1.5">{SIGNS[d.sign]!.en}</td>
                  <td className="py-1.5">{ordinal(d.house ?? d.houseFromMoon)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`/api/chart/${profileId}/pdf?style=${style}`}
          className="flex h-12 items-center justify-center gap-2 rounded-input bg-accent text-[15px] font-semibold text-accent-ink no-underline hover:text-accent-ink"
        >
          <Download aria-hidden size={18} />
          Download PDF
        </a>
        <a
          href={origin ? whatsAppUrl(kundaliShareText(chart, origin)) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-input border border-border bg-surface text-[15px] text-text no-underline hover:text-text"
        >
          <Share2 aria-hidden size={18} />
          Share on WhatsApp
        </a>
      </div>
    </>
  );
}
