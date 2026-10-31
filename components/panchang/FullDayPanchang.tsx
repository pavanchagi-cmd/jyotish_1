"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { formatDayTime, formatTime } from "@/lib/format";
import { usePanchang, type Place } from "./usePanchang";

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-divider py-2.5 last:border-0">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-right">
        <div className="text-[15px] font-semibold">{value}</div>
        {sub ? <div className="text-xs text-muted">{sub}</div> : null}
      </div>
    </div>
  );
}

/** Full-day Panchang ("Full day" link on Home). */
export function FullDayPanchang({ place, initialDate }: { place: Place; initialDate?: string }) {
  const [date, setDate] = useState<string | undefined>(initialDate);
  const state = usePanchang(place, date);
  const shown = state.status === "ready" ? state.data.date : date;

  function shift(days: number) {
    if (!shown) return;
    setDate(DateTime.fromISO(shown).plus({ days }).toISODate()!);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous day" onClick={() => shift(-1)} className="flex size-11 items-center justify-center rounded-full bg-surface text-text">
          <ChevronLeft aria-hidden size={20} />
        </button>
        <div className="text-center">
          <div className="text-[15px] font-semibold">{shown ? DateTime.fromISO(shown).toFormat("cccc, d LLLL yyyy") : "Today"}</div>
          <div className="text-[13px] text-muted">{place.label}</div>
        </div>
        <button type="button" aria-label="Next day" onClick={() => shift(1)} className="flex size-11 items-center justify-center rounded-full bg-surface text-text">
          <ChevronRight aria-hidden size={20} />
        </button>
      </div>

      {state.status === "loading" ? (
        <div aria-busy="true" className="h-96 animate-pulse rounded-card-lg bg-surface" />
      ) : state.status === "error" ? (
        <p role="alert" className="m-0 text-sm text-warm-text">
          {state.message}
        </p>
      ) : (
        (() => {
          const p = state.data;
          const z = p.zone;
          const ends = (iso: string | null) => (iso ? `until ${formatDayTime(iso, z)}` : undefined);
          return (
            <>
              <section className="rounded-card-lg border border-border bg-surface px-4 py-2">
                <Row label="Sunrise" value={formatTime(p.sunrise, z)} />
                <Row label="Sunset" value={formatTime(p.sunset, z)} />
                <Row label="Vara (day)" value={p.vara.name} />
                <Row label="Tithi" value={`${p.tithi.paksha} ${p.tithi.name}`} sub={ends(p.tithi.endsAt)} />
                <Row label="Nakshatra" value={`${p.nakshatra.name} · pada ${p.nakshatra.pada}`} sub={ends(p.nakshatra.endsAt)} />
                <Row label="Yoga" value={p.yoga.name} sub={ends(p.yoga.endsAt)} />
                <Row label="Karana" value={p.karana.name} sub={ends(p.karana.endsAt)} />
              </section>
              <section className="rounded-card-lg border border-warm-border bg-warm-surface px-4 py-2">
                <Row
                  label="Rahu Kaal"
                  value={p.rahuKaal ? `${formatTime(p.rahuKaal.start, z)} – ${formatTime(p.rahuKaal.end, z)}` : "—"}
                  sub="Avoid starting new work"
                />
                <Row
                  label="Abhijit Muhurta"
                  value={p.abhijit ? `${formatTime(p.abhijit.start, z)} – ${formatTime(p.abhijit.end, z)}` : "—"}
                  sub={p.abhijit?.avoidOnWednesday ? "Traditionally not used on Wednesdays" : "Good time to begin tasks"}
                />
              </section>
              <p className="m-0 text-xs text-muted">
                Values are taken at local sunrise ({z}). Times are local to {place.label}.
              </p>
            </>
          );
        })()
      )}
    </div>
  );
}
