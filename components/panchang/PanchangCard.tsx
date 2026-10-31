"use client";

import Link from "next/link";
import { LocateFixed } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useCurrentPlace, usePanchang, type Place } from "./usePanchang";

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[15px] font-semibold">{value}</div>
    </div>
  );
}

/** Today's Panchang card (design/Home.html). */
export function PanchangCard({ fallback }: { fallback: Place }) {
  const { place, locate, locating, error, usingFallback } = useCurrentPlace(fallback);
  const state = usePanchang(place);

  return (
    <section aria-labelledby="panchang-title" className="flex flex-col gap-3 rounded-card-lg border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="panchang-title" className="m-0 font-heading text-[21px] font-bold">
          Today’s Panchang
        </h2>
        <div className="truncate text-[13px] text-muted">{place.label}</div>
      </div>

      {state.status === "loading" ? (
        <div aria-busy="true" aria-label="Loading Panchang" className="grid grid-cols-2 gap-x-4 gap-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-bg" />
          ))}
        </div>
      ) : state.status === "error" ? (
        <p role="alert" className="m-0 text-sm text-warm-text">
          {state.message}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Item label="Tithi" value={`${state.data.tithi.paksha} ${state.data.tithi.name}`} />
            <Item label="Nakshatra" value={state.data.nakshatra.name} />
            <Item label="Yoga" value={state.data.yoga.name} />
            <Item label="Karana" value={state.data.karana.name} />
            <Item label="Vara (day)" value={state.data.vara.name} />
            <Item
              label="Sunrise · Sunset"
              value={`${formatTime(state.data.sunrise, state.data.zone)} · ${formatTime(state.data.sunset, state.data.zone)}`}
            />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-input border border-warm-border bg-warm-surface px-3 py-2.5">
            <div>
              <div className="text-xs text-warm-soft">Rahu Kaal (avoid starting new work)</div>
              <div className="text-[15px] font-semibold text-warm-text">
                {state.data.rahuKaal
                  ? `${formatTime(state.data.rahuKaal.start, state.data.zone)} – ${formatTime(state.data.rahuKaal.end, state.data.zone)}`
                  : "No sunrise today"}
              </div>
            </div>
            <Link
              href={`/panchang?${new URLSearchParams({ lat: String(place.lat), lng: String(place.lng), label: place.label })}`}
              className="flex min-h-11 items-center text-sm font-semibold"
            >
              Full day
            </Link>
          </div>
        </>
      )}

      {usingFallback ? (
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-accent disabled:opacity-60"
        >
          <LocateFixed aria-hidden size={16} />
          {locating ? "Finding your location…" : "Use my current location"}
        </button>
      ) : null}
      {error ? <p className="m-0 text-xs text-muted">{error}</p> : null}
    </section>
  );
}
