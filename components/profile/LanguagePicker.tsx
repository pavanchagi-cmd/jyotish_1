"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "en", label: "English", lang: "en" },
  { value: "hi", label: "हिन्दी", lang: "hi" },
  { value: "kn", label: "ಕನ್ನಡ", lang: "kn" },
] as const;

export function LanguagePicker({ initial }: { initial: "en" | "hi" | "kn" }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);

  async function choose(next: "en" | "hi" | "kn") {
    const prev = value;
    setValue(next);
    setStatus(null);
    const res = await fetch("/api/me/language", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setValue(prev);
      setStatus("Could not save. Please try again.");
    } else {
      setStatus("Saved. New readings will use this language.");
    }
  }

  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-1.5 text-sm font-semibold">Reading language</legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            lang={o.lang}
            aria-pressed={value === o.value}
            onClick={() => choose(o.value)}
            className={`h-11 rounded-[22px] border px-4 text-[15px] ${value === o.value ? "border-accent bg-warm-strong text-warm-text" : "border-border bg-surface text-text"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="m-0 min-h-5 text-xs text-muted">
        {status}
      </p>
    </fieldset>
  );
}
