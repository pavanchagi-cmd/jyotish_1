"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { Place } from "@/lib/geo/types";
import { placeLabel } from "@/lib/geo/types";
import type { OffsetChoice } from "@/lib/time/offsets";
import { isValidDate, MIN_BIRTH_DATE } from "@/lib/time/resolve";
import { maxBirthDate, profileInputSchema } from "@/lib/validation/birth";
import { PlaceField } from "./PlaceField";
import { ResolvedCard, type Resolution } from "./ResolvedCard";

type Gender = "female" | "male" | "other";
type Language = "en" | "hi" | "kn";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const LANGUAGES: { value: Language; label: string; lang: string }[] = [
  { value: "en", label: "English", lang: "en" },
  { value: "hi", label: "हिन्दी", lang: "hi" },
  { value: "kn", label: "ಕನ್ನಡ", lang: "kn" },
];

const chip = (selected: boolean) =>
  selected ? "border-accent bg-warm-strong text-warm-text" : "border-border bg-surface text-text";

/** Birth details form (design/Main.html, spec section 4). */
export function BirthForm() {
  const router = useRouter();
  const id = useId();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeKnown, setTimeKnown] = useState(true);
  const [place, setPlace] = useState<Place | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [resolved, setResolved] = useState<{ key: string; r: Resolution } | null>(null);
  const [choice, setChoice] = useState<OffsetChoice>({ kind: "auto" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveTime = timeKnown && /^\d{2}:\d{2}$/.test(time) ? time : null;
  const resolveKey =
    place && isValidDate(date) && (!timeKnown || effectiveTime)
      ? `${place.lat},${place.lng},${date},${timeKnown ? effectiveTime : "noon"}`
      : null;
  // Only show a resolution that matches the current inputs.
  const resolution = resolved && resolved.key === resolveKey ? resolved.r : null;

  // Resolve zone + offset whenever place, date or time changes.
  useEffect(() => {
    if (!resolveKey || !place) return;
    const key = resolveKey;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/places/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: place.lat, lng: place.lng, date, time: timeKnown ? effectiveTime : null }),
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const r = (await res.json()) as Resolution;
        setResolved({ key, r });
        // A new place/date resets any earlier offset choice that no longer applies.
        setChoice((c) => (c.kind === "custom" || r.needsOffsetChoice ? c : { kind: "auto" }));
      } catch {
        /* aborted or offline */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      fullName,
      gender,
      date,
      time: timeKnown ? effectiveTime : null,
      timeKnown,
      place: place ? { name: placeLabel(place), lat: place.lat, lng: place.lng } : undefined,
      offsetChoice: choice,
      language,
    };
    const parsed = profileInputSchema.safeParse(payload);
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] ??= key === "place" ? "Choose your place of birth from the list." : issue.message;
      }
    }
    if (resolution?.status === "nonexistent" && choice.kind !== "custom") {
      next.offset = "Enter the UTC offset from your birth record, or check the time.";
    }
    setErrors(next);
    if (Object.keys(next).length || !parsed.success) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setFormError(data.error ?? "Could not save. Please try again.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setFormError("Could not save. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (field: string, highlight = false) =>
    `h-12 w-full rounded-input border bg-surface px-3.5 text-base text-text [color-scheme:dark] ${
      errors[field] ? "border-warm-text" : highlight ? "border-accent" : "border-border"
    }`;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-name`} className="text-sm font-semibold">
          Full name
        </label>
        <input
          id={`${id}-name`}
          autoComplete="name"
          placeholder="e.g. Ananya Sharma"
          value={fullName}
          maxLength={80}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? `${id}-name-err` : undefined}
          className={inputClass("fullName")}
        />
        {errors.fullName ? (
          <p id={`${id}-name-err`} className="m-0 text-sm text-warm-text">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-sm font-semibold">
          Gender <span className="font-normal text-muted">(used for Kundali matching)</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              aria-pressed={gender === g.value}
              onClick={() => setGender(gender === g.value ? null : g.value)}
              className={`h-11 rounded-input border text-[15px] ${chip(gender === g.value)}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-dob`} className="text-sm font-semibold">
            Date of birth
          </label>
          <input
            id={`${id}-dob`}
            type="date"
            min={MIN_BIRTH_DATE}
            max={maxBirthDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={errors.date ? true : undefined}
            className={inputClass("date")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-tob`} className="text-sm font-semibold">
            Exact time of birth
          </label>
          <input
            id={`${id}-tob`}
            type="time"
            value={timeKnown ? time : ""}
            disabled={!timeKnown}
            onChange={(e) => setTime(e.target.value)}
            aria-invalid={errors.time ? true : undefined}
            className={`${inputClass("time", timeKnown)} disabled:opacity-50`}
          />
        </div>
      </div>
      {errors.date || errors.time ? (
        <p className="-mt-3 m-0 text-sm text-warm-text">{errors.date ?? errors.time}</p>
      ) : null}

      <div className="flex flex-col gap-1.5 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3.5">
        {timeKnown ? (
          <>
            <div className="text-sm font-semibold text-warm-text">Why the exact time matters</div>
            <p className="m-0 text-sm leading-normal text-warm-soft">
              Your Lagna (ascendant) changes roughly every 2 hours. Example: born at 06:42 AM in Jaipur gives a Leo
              Lagna; born at 08:50 AM the same day gives Virgo, which changes every house in your chart. Use the time
              on your birth certificate or hospital record.
            </p>
            <button
              type="button"
              onClick={() => setTimeKnown(false)}
              className="min-h-11 self-start text-left text-sm font-semibold text-accent"
            >
              I don’t know my exact time
            </button>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-warm-text">No problem</div>
            <p className="m-0 text-sm leading-normal text-warm-soft">
              We will use 12:00 noon. Your readings will use your Moon sign only, and Lagna and house-based parts will
              be hidden.
            </p>
            <button
              type="button"
              onClick={() => setTimeKnown(true)}
              className="min-h-11 self-start text-left text-sm font-semibold text-accent"
            >
              I know my time
            </button>
          </>
        )}
      </div>

      <PlaceField
        value={place}
        onChange={(p) => {
          setPlace(p);
          setChoice({ kind: "auto" });
        }}
        error={errors.place}
      />

      {resolution && place ? (
        <ResolvedCard
          key={`${resolution.zone}-${date}`}
          resolution={resolution}
          year={date.slice(0, 4)}
          choice={choice}
          onChoice={setChoice}
        />
      ) : null}
      {errors.offset ? <p className="-mt-3 m-0 text-sm text-warm-text">{errors.offset}</p> : null}

      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-sm font-semibold">Reading language</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              lang={l.lang}
              aria-pressed={language === l.value}
              onClick={() => setLanguage(l.value)}
              className={`h-11 rounded-[22px] border px-4 text-[15px] ${chip(language === l.value)}`}
            >
              {l.label}
            </button>
          ))}
          <button
            type="button"
            disabled
            title="More languages are coming later"
            className="h-11 rounded-[22px] border border-border bg-surface px-4 text-[15px] text-muted opacity-60"
          >
            More
          </button>
        </div>
      </fieldset>

      <div aria-live="assertive" className="text-sm text-warm-text empty:hidden">
        {formError}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-1 flex h-[54px] items-center justify-center rounded-[14px] bg-accent text-[17px] font-semibold text-accent-ink disabled:opacity-60"
      >
        {saving ? "Saving…" : "Generate my Kundali"}
      </button>
    </form>
  );
}
