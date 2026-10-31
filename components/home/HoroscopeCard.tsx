"use client";

import { useState } from "react";
import { ErrorRetry, SkeletonLines } from "@/components/Skeleton";
import { useJson } from "@/lib/client/useJson";
import { formatTime } from "@/lib/format";

type Period = "day" | "week" | "month";
const TABS: { id: Period; label: string }[] = [
  { id: "day", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

interface HoroscopeResponse {
  reading: { title: string; body: string; example: string };
  lucky: { colour: string; number: number };
  goodTime: { start: string; end: string; zone: string; avoidToday: boolean } | null;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input bg-bg p-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[15px] font-semibold">{value}</div>
    </div>
  );
}

/** Horoscope card with Today / This week / This month tabs (design/Home.html). */
export function HoroscopeCard({ profileId }: { profileId: string }) {
  const [period, setPeriod] = useState<Period>("day");
  const [state, retry] = useJson<HoroscopeResponse>(`/api/horoscope?profileId=${profileId}&period=${period}`);

  return (
    <section aria-label="Horoscope" className="flex flex-col gap-3.5 rounded-card-lg border border-border bg-surface p-4">
      <div role="tablist" aria-label="Horoscope period" className="grid grid-cols-3 gap-1.5 rounded-input bg-bg p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={period === t.id}
            aria-controls="horoscope-panel"
            onClick={() => setPeriod(t.id)}
            className={`h-11 rounded-[9px] text-[15px] ${period === t.id ? "bg-accent font-semibold text-accent-ink" : "text-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="horoscope-panel" role="tabpanel" aria-live="polite" className="flex flex-col gap-3.5">
        {state.status === "loading" ? (
          <>
            <div className="h-6 w-3/4 animate-pulse rounded bg-bg" />
            <SkeletonLines lines={3} label="Writing your horoscope" />
          </>
        ) : state.status === "error" ? (
          <ErrorRetry message={state.message} onRetry={retry} />
        ) : (
          <>
            <h2 className="m-0 font-heading text-[21px] font-bold">{state.data.reading.title}</h2>
            <p className="m-0 text-[15px] leading-[1.55] text-text-soft">
              {state.data.reading.body} {state.data.reading.example}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Tile label="Lucky colour" value={state.data.lucky.colour} />
              <Tile label="Lucky number" value={String(state.data.lucky.number)} />
              <Tile
                label="Good time"
                value={
                  state.data.goodTime
                    ? `${formatTime(state.data.goodTime.start, state.data.goodTime.zone).replace(/ (AM|PM)$/, "")}–${formatTime(state.data.goodTime.end, state.data.goodTime.zone)}`
                    : "—"
                }
              />
            </div>
            {state.data.goodTime?.avoidToday ? (
              <p className="m-0 text-xs text-muted">Abhijit Muhurta is traditionally not used on Wednesdays.</p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
