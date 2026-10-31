"use client";

import { useEffect, useState } from "react";
import { ErrorRetry, SkeletonLines } from "@/components/Skeleton";
import { useJson } from "@/lib/client/useJson";
import { HEALTH_DISCLAIMER, type ForecastYear } from "@/lib/llm/schemas";

const AREAS = [
  ["career", "Career"],
  ["finance", "Finance"],
  ["family", "Family"],
  ["health", "Health"],
  ["marriage", "Marriage life"],
] as const;

interface ForecastResponse {
  years: number[];
  forecast: ForecastYear;
  approximate: boolean;
}

function Dots({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5`} role="img">
      {"●".repeat(rating)}
      {"○".repeat(5 - rating)}
    </span>
  );
}

/** "Other years at a glance": headlines for the other four years, loaded one at a time. */
function OtherYears({ profileId, years, selected, onPick }: { profileId: string; years: number[]; selected: number; onPick: (y: number) => void }) {
  const [glance, setGlance] = useState<Record<number, ForecastYear | "error">>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const y of years) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/forecast/${profileId}?year=${y}`);
          const body = await res.json();
          if (!cancelled) setGlance((g) => ({ ...g, [y]: res.ok ? (body as ForecastResponse).forecast : "error" }));
        } catch {
          if (!cancelled) setGlance((g) => ({ ...g, [y]: "error" }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, years]);

  const others = years.filter((y) => y !== selected);
  return (
    <section aria-labelledby="glance-title" className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5">
      <h2 id="glance-title" className="m-0 font-heading text-xl font-bold">
        The other years at a glance
      </h2>
      {others.map((y, i) => {
        const f = glance[y];
        return (
          <button
            key={y}
            type="button"
            onClick={() => onPick(y)}
            className={`flex min-h-11 flex-col gap-0.5 text-left ${i < others.length - 1 ? "border-b border-divider pb-2.5" : ""}`}
          >
            {f && f !== "error" ? (
              <>
                <span className="text-[15px] font-semibold">
                  {y} · {f.headline}
                </span>
                <span className="text-sm leading-normal text-text-soft">{f.why}</span>
              </>
            ) : f === "error" ? (
              <span className="text-[15px] font-semibold">{y} · tap to load</span>
            ) : (
              <>
                <span className="text-[15px] font-semibold">{y}</span>
                <span className="h-4 w-4/5 animate-pulse rounded bg-bg" />
              </>
            )}
          </button>
        );
      })}
    </section>
  );
}

/** 5-year forecast screen body (design/Forecast.html). */
export function ForecastView({ profileId, years, lang = "en" }: { profileId: string; years: number[]; lang?: string }) {
  const [year, setYear] = useState(years[0]!);
  const [state, retry] = useJson<ForecastResponse>(`/api/forecast/${profileId}?year=${year}`);
  const f = state.status === "ready" ? state.data.forecast : null;

  return (
    <>
      <div role="tablist" aria-label="Year" className="flex flex-wrap gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            role="tab"
            aria-selected={y === year}
            onClick={() => setYear(y)}
            className={`h-11 rounded-[22px] border px-3.5 text-[15px] ${y === year ? "border-accent bg-accent font-semibold text-accent-ink" : "border-border bg-surface text-text"}`}
          >
            {y}
          </button>
        ))}
      </div>

      {state.status === "error" ? <ErrorRetry message={state.message} onRetry={retry} /> : null}
      {state.status === "ready" && state.data.approximate ? (
        <p className="m-0 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm text-warm-soft">
          Your birth time is missing, so this forecast uses your Moon sign only.
        </p>
      ) : null}

      <section aria-live="polite" aria-busy={state.status === "loading"} lang={lang} className="flex flex-col gap-2 rounded-card-lg border border-warm-border bg-warm-strong p-4">
        <div className="text-xs font-semibold tracking-[0.06em] text-warm-soft uppercase">{year} in one line</div>
        {f ? (
          <>
            <div className="font-heading text-[22px] font-bold text-warm-text">{f.headline}</div>
            <p className="m-0 text-sm leading-normal text-warm-soft">Why: {f.why}</p>
          </>
        ) : state.status === "loading" ? (
          <SkeletonLines lines={3} label={`Writing your ${year} forecast`} />
        ) : null}
      </section>

      {AREAS.map(([key, title]) => {
        const a = f?.areas[key];
        const summary = a && key === "health" ? a.summary.replace(HEALTH_DISCLAIMER, "").trim() : a?.summary;
        return (
          <section key={key} aria-labelledby={`area-${key}`} lang={lang} className="flex flex-col gap-2 rounded-card border border-border bg-surface px-4 py-3.5">
            <div className="flex items-center justify-between">
              <h2 id={`area-${key}`} className="m-0 font-heading text-xl font-bold">
                {title}
              </h2>
              {a ? (
                <span className="text-sm font-semibold text-warm-text">
                  {a.label} · <Dots rating={a.rating} />
                </span>
              ) : null}
            </div>
            {a ? (
              <>
                <p className="m-0 text-sm leading-[1.55] text-text-soft">{summary}</p>
                <p className="m-0 text-sm leading-[1.55] text-text-soft">
                  <b className="text-text">Example:</b> {a.example.replace(/^Example:\s*/, "")}
                </p>
                <p className="m-0 text-sm leading-[1.55] text-text-soft">
                  <b className="text-text">Tip:</b> {a.tip}
                </p>
                {key === "health" ? <p className="m-0 text-xs text-muted">{HEALTH_DISCLAIMER}</p> : null}
              </>
            ) : state.status === "loading" ? (
              <SkeletonLines lines={2} />
            ) : null}
          </section>
        );
      })}

      <OtherYears profileId={profileId} years={years} selected={year} onPick={setYear} />

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" disabled title="Coming in a later version" className="h-12 rounded-input bg-accent text-[15px] font-semibold text-accent-ink opacity-50">
          Download report
        </button>
        <button type="button" disabled title="Coming in a later version" className="h-12 rounded-input border border-border bg-surface text-[15px] text-muted">
          Ask an astrologer
        </button>
      </div>
    </>
  );
}
