"use client";

import { DateTime } from "luxon";
import { ErrorRetry, SkeletonLines } from "@/components/Skeleton";
import type { DashaReport } from "@/lib/astro/dasha-summary";
import { SIGNS } from "@/lib/astro/tables/signs";
import { useJson } from "@/lib/client/useJson";
import type { DashaSummary } from "@/lib/llm/schemas";

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const yr = (iso: string) => iso.slice(0, 4);
const monYr = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yy");

/** Dasha & transits screen body (design/Dasha.html). Numbers render at once; text loads after. */
export function DashaView({ profileId, report, lang = "en" }: { profileId: string; report: DashaReport; lang?: string }) {
  const [state, retry] = useJson<{ summary: DashaSummary }>(`/api/dasha/${profileId}?summary=1`);
  const summary = state.status === "ready" ? state.data.summary : null;
  const cur = report.current;

  return (
    <>
      {report.approximate ? (
        <p className="m-0 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm text-warm-soft">
          Your birth time is missing, so dasha dates are approximate (the Moon moves about 13° a day).
        </p>
      ) : null}

      {cur ? (
        <section aria-labelledby="now-title" className="flex flex-col gap-2.5 rounded-card-lg border border-warm-border bg-warm-strong p-4">
          <div className="text-xs font-semibold tracking-[0.06em] text-warm-soft uppercase">You are running now</div>
          <h2 id="now-title" className="m-0 font-heading text-2xl font-bold text-warm-text">
            {cur.mahadasha.lord} – {cur.antardasha.lord}
          </h2>
          <dl className="m-0 grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-warm-soft">Mahadasha (main)</dt>
              <dd className="m-0 text-[15px] font-semibold">
                {cur.mahadasha.lord} · {yr(cur.mahadasha.start)}–{yr(cur.mahadasha.end)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-warm-soft">Antardasha (sub)</dt>
              <dd className="m-0 text-[15px] font-semibold">
                {cur.antardasha.lord} · {monYr(cur.antardasha.start)}–{monYr(cur.antardasha.end)}
              </dd>
            </div>
          </dl>
          <div
            role="progressbar"
            aria-label="Progress through the current sub-period"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(cur.antardashaProgress * 100)}
            className="h-2 rounded bg-warm-border"
          >
            <div className="h-2 rounded bg-accent" style={{ width: `${Math.round(cur.antardashaProgress * 100)}%` }} />
          </div>
          <div aria-live="polite" lang={lang}>
            {state.status === "loading" ? (
              <SkeletonLines lines={3} label="Explaining your current period" />
            ) : state.status === "error" ? (
              <ErrorRetry message={state.message} onRetry={retry} />
            ) : (
              <p className="m-0 text-sm leading-normal text-warm-soft">
                {summary!.currentPeriod.summary} {summary!.currentPeriod.example}
              </p>
            )}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="timeline-title" className="flex flex-col gap-2.5 rounded-card-lg border border-border bg-surface px-4 py-3.5">
        <h2 id="timeline-title" className="m-0 font-heading text-xl font-bold">
          Your dasha timeline
        </h2>
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {report.timeline.map((m, i) => {
            const currentIndex = report.timeline.findIndex((x) => x.current);
            const past = currentIndex >= 0 && i < currentIndex;
            return (
              <li
                key={m.start}
                aria-current={m.current ? "step" : undefined}
                className={`flex justify-between ${m.current ? "rounded-[10px] bg-bg px-2.5 py-2 text-[15px] font-semibold text-warm-text" : `py-1 text-sm ${past ? "text-muted" : ""}`}`}
              >
                <span>{m.current ? `${m.lord} · now` : m.lord}</span>
                <span>
                  {yr(m.start)} – {yr(m.end)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="gochar-title" className="flex flex-col gap-3 rounded-card-lg border border-border bg-surface px-4 py-3.5">
        <h2 id="gochar-title" className="m-0 font-heading text-xl font-bold">
          Planets moving now (Gochar)
        </h2>
        {report.transits.map((t, i) => {
          const meaning = summary?.transits.find((x) => x.planet === t.planet)?.meaning;
          return (
            <div key={t.planet} className={`flex flex-col gap-0.5 ${i < report.transits.length - 1 ? "border-b border-divider pb-2.5" : ""}`}>
              <div className="flex justify-between text-[15px] font-semibold">
                <span>
                  {t.planet} in {SIGNS[t.sign]!.en}
                </span>
                <span className="text-warm-text">{ordinal(t.houseFromMoon)} from Moon</span>
              </div>
              {meaning ? (
                <div className="text-sm leading-normal text-text-soft">{meaning}</div>
              ) : state.status === "loading" ? (
                <div className="h-4 w-4/5 animate-pulse rounded bg-bg" />
              ) : null}
            </div>
          );
        })}
      </section>

      <details className="group rounded-[14px] border border-border bg-surface px-4 py-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2">
          <div>
            <div className="text-xs text-muted">Sade Sati status</div>
            <div className="text-[15px] font-semibold">
              {report.sadeSati.active
                ? `Active · ${report.sadeSati.phase === "rising" ? "first" : report.sadeSati.phase === "peak" ? "middle" : "last"} phase`
                : `Not active${report.sadeSati.nextStart ? ` · next: ${yr(report.sadeSati.nextStart as unknown as string)}` : ""}`}
            </div>
          </div>
          <span className="text-sm font-semibold text-accent group-open:hidden">Learn more</span>
          <span className="hidden text-sm font-semibold text-accent group-open:inline">Close</span>
        </summary>
        <p className="mt-2 mb-0 text-sm leading-normal text-text-soft">
          Sade Sati is the roughly 7½ years when Saturn passes through the sign before your Moon sign, your Moon sign, and the
          sign after it. Saturn rewards patience and steady effort. Many people use this time to build discipline, finish
          long tasks and plan their money carefully.
        </p>
      </details>
    </>
  );
}
