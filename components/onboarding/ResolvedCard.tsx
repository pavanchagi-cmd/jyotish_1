"use client";

import { useId, useState } from "react";
import type { OffsetChoice } from "@/lib/time/offsets";
import { formatOffset, parseOffset } from "@/lib/time/offsets";

export interface Resolution {
  lat: number;
  lng: number;
  zone: string;
  offsetSeconds: number;
  offsetLabel: string;
  zoneAbbreviation: string;
  isDst: boolean;
  status: "ok" | "nonexistent" | "ambiguous";
  alternativeOffsetSeconds?: number;
  needsOffsetChoice: boolean;
  offsetOptions?: { kind: "auto" | "bombay" | "calcutta"; label: string; seconds: number }[];
}

function coord(value: number, pos: string, neg: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? pos : neg}`;
}

interface Props {
  resolution: Resolution;
  year: string;
  choice: OffsetChoice;
  onChoice: (c: OffsetChoice) => void;
}

/**
 * "Auto-detected for accuracy" card (design/Main.html): shows lat, lng, zone
 * and the offset in force on the birth date, and lets the user change it.
 */
export function ResolvedCard({ resolution: r, year, choice, onChoice }: Props) {
  const id = useId();
  const [customText, setCustomText] = useState(
    choice.kind === "custom" ? formatOffset(choice.seconds).replace("UTC ", "").replace("−", "-") : "",
  );
  const [editing, setEditing] = useState(choice.kind === "custom" || r.status === "nonexistent");
  const customInvalid = customText !== "" && parseOffset(customText) === null;

  const effectiveSeconds =
    choice.kind === "custom"
      ? choice.seconds
      : (r.offsetOptions?.find((o) => o.kind === choice.kind)?.seconds ?? r.offsetSeconds);

  function setCustom(text: string) {
    setCustomText(text);
    const seconds = parseOffset(text);
    if (seconds !== null) onChoice({ kind: "custom", seconds });
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-surface px-4 py-3.5"
    >
      <h2 id={`${id}-title`} className="m-0 text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">
        Auto-detected for accuracy
      </h2>
      <dl className="m-0 grid grid-cols-2 gap-2.5">
        <div>
          <dt className="text-xs text-muted">Latitude</dt>
          <dd className="m-0 text-base font-semibold">{coord(r.lat, "N", "S")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Longitude</dt>
          <dd className="m-0 text-base font-semibold">{coord(r.lng, "E", "W")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Time zone in {year}</dt>
          <dd className="m-0 text-base font-semibold">
            {choice.kind === "auto" ? `${r.zoneAbbreviation} · ${r.offsetLabel}` : formatOffset(effectiveSeconds)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Daylight saving</dt>
          <dd className="m-0 text-base font-semibold">{r.isDst ? "In use" : "Not in use"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted">Zone</dt>
          <dd className="m-0 text-[15px]">{r.zone}</dd>
        </div>
      </dl>

      {r.status === "nonexistent" ? (
        <p role="alert" className="m-0 rounded-input border border-warm-border bg-warm-surface px-3 py-2 text-sm text-warm-soft">
          Clocks moved forward at this time, so this exact time did not exist on that date. Please check your time, or
          enter the UTC offset from your birth record below.
        </p>
      ) : null}
      {r.status === "ambiguous" && r.alternativeOffsetSeconds !== undefined ? (
        <p className="m-0 rounded-input border border-warm-border bg-warm-surface px-3 py-2 text-sm text-warm-soft">
          Clocks went back at this time, so it happened twice: at {r.offsetLabel} and at{" "}
          {formatOffset(r.alternativeOffsetSeconds)}. We used {r.offsetLabel}. Change it below if your record says
          otherwise.
        </p>
      ) : null}

      {r.needsOffsetChoice && r.offsetOptions ? (
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1 text-sm font-semibold text-text">
            Which time does your birth record use?
          </legend>
          <p className="m-0 text-[13px] leading-normal text-muted">
            Before 1956, Mumbai and Kolkata often kept their own local time. If you are not sure, keep the first option.
          </p>
          {[...r.offsetOptions, { kind: "custom" as const, label: "Another offset", seconds: 0 }].map((o) => (
            <label key={o.kind} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="radio"
                name={`${id}-offset`}
                className="size-5 accent-accent"
                checked={choice.kind === o.kind}
                onChange={() => {
                  if (o.kind === "custom") {
                    setEditing(true);
                    const s = parseOffset(customText);
                    onChoice({ kind: "custom", seconds: s ?? r.offsetSeconds });
                    if (s === null) setCustomText(formatOffset(r.offsetSeconds).replace("UTC ", ""));
                  } else {
                    onChoice({ kind: o.kind });
                  }
                }}
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      ) : !editing ? (
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setCustom(formatOffset(r.offsetSeconds).replace("UTC ", "").replace("−", "-"));
          }}
          className="min-h-11 self-start text-sm font-semibold text-accent"
        >
          Edit UTC offset
        </button>
      ) : null}

      {editing && (choice.kind === "custom" || !r.needsOffsetChoice) ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-custom`} className="text-sm font-semibold">
            UTC offset at birth
          </label>
          <div className="flex gap-2">
            <input
              id={`${id}-custom`}
              inputMode="text"
              placeholder="+05:30"
              value={customText}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={customInvalid || undefined}
              aria-describedby={`${id}-custom-help`}
              className={`h-12 w-40 rounded-input border bg-bg px-3.5 text-base text-text ${customInvalid ? "border-warm-text" : "border-border"}`}
            />
            {!r.needsOffsetChoice ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setCustomText("");
                  onChoice({ kind: "auto" });
                }}
                className="min-h-11 px-2 text-sm font-semibold text-accent"
              >
                Use detected
              </button>
            ) : null}
          </div>
          <p id={`${id}-custom-help`} className={`m-0 text-xs ${customInvalid ? "text-warm-text" : "text-muted"}`}>
            {customInvalid ? "Use a format like +05:30 or +05:53:20." : "Format: +HH:MM or +HH:MM:SS."}
          </p>
        </div>
      ) : null}

      <p className="m-0 text-[13px] leading-normal text-muted">
        We use the time zone that was in force on your birth date, not today’s. Example: Mumbai used its own “Bombay
        Time” until 1955, and India used UTC +06:30 during parts of WWII.
      </p>
    </section>
  );
}
