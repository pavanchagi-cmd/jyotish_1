"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { placeLabel, type Place } from "@/lib/geo/types";

interface Props {
  value: Place | null;
  onChange: (place: Place | null) => void;
  error?: string;
}

type Mode = "suggest" | "search";

/**
 * Place of birth combobox: type-ahead from the bundled GeoNames list, plus a
 * "Search" button that asks Nominatim when the place isn't in the list.
 */
export function PlaceField({ value, onChange, error }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(value ? placeLabel(value) : "");
  const [results, setResults] = useState<Place[]>([]);
  const [mode, setMode] = useState<Mode>("suggest");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const query = text.trim();
  const canSearch = query.length >= 2 && !value;
  // Stale results are hidden rather than cleared inside the effect.
  const visible = canSearch ? results : [];
  const showList = open && visible.length > 0;

  // Type-ahead (debounced). Only runs while no place is selected.
  useEffect(() => {
    const seq = ++requestSeq.current;
    if (value || query.length < 2) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/suggest?q=${encodeURIComponent(query)}`);
        if (seq !== requestSeq.current) return;
        const data = res.ok ? ((await res.json()) as { results: Place[] }) : { results: [] };
        setMode("suggest");
        setResults(data.results);
        setActive(data.results.length ? 0 : -1);
        setOpen(true);
        setMessage(null);
      } catch {
        if (seq === requestSeq.current) setResults([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, value]);

  async function runSearch() {
    if (!canSearch) return;
    const seq = ++requestSeq.current;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      if (seq !== requestSeq.current) return;
      const data = (await res.json()) as { results?: Place[]; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Search failed. Please try again.");
        return;
      }
      const found = data.results ?? [];
      setMode("search");
      setResults(found);
      setActive(found.length ? 0 : -1);
      setOpen(true);
      if (!found.length) setMessage("No places found. Try adding the state or country, e.g. “Ranikhet, Uttarakhand”.");
    } catch {
      setMessage("Search failed. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function select(p: Place) {
    onChange(p);
    setText(placeLabel(p));
    setOpen(false);
    setResults([]);
    setMessage(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && visible.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % visible.length);
    } else if (e.key === "ArrowUp" && visible.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? visible.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (showList && active >= 0 && visible[active]) {
        e.preventDefault();
        select(visible[active]);
      } else if (canSearch) {
        e.preventDefault();
        void runSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }


  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        Place of birth
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-help`}
          autoComplete="off"
          placeholder="Jaipur, Rajasthan, India"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (value) onChange(null);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={`h-12 w-full rounded-input border bg-surface px-3.5 text-base text-text ${
            error ? "border-warm-text" : value ? "border-accent" : "border-border"
          }`}
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={mode === "search" ? "Search results" : "Suggestions"}
            className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-72 overflow-y-auto rounded-input border border-border bg-surface py-1 shadow-lg"
          >
            {visible.map((p, i) => (
              <li
                key={p.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(p)}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-11 cursor-pointer flex-col justify-center px-3.5 py-1.5 ${i === active ? "bg-warm-strong" : ""}`}
              >
                <span className="text-[15px] font-semibold">{p.name}</span>
                <span className="text-[13px] text-muted">{[p.admin1, p.country].filter(Boolean).join(", ")}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {canSearch && mode === "suggest" ? (
        <>
          {!visible.length && !busy ? (
            <p className="m-0 text-sm text-muted">No match in the city list yet. Tap Search to look it up.</p>
          ) : null}
          <button
            type="button"
            onClick={runSearch}
            disabled={busy}
            className={`flex min-h-11 items-center gap-2 self-start rounded-input px-3.5 text-sm font-semibold disabled:opacity-60 ${
              visible.length ? "border border-border bg-surface text-text" : "bg-accent text-accent-ink"
            }`}
          >
            <Search aria-hidden size={16} />
            {busy ? "Searching…" : visible.length ? "Not in the list? Search all places" : `Search for “${query}”`}
          </button>
        </>
      ) : null}

      <div aria-live="polite" className="text-sm text-warm-text">
        {error ?? message ?? ""}
      </div>
      <p id={`${id}-help`} className="m-0 text-xs text-muted">
        {mode === "search" && visible.length
          ? "Search results © OpenStreetMap contributors."
          : "City list: GeoNames (CC BY 4.0)."}
      </p>
    </div>
  );
}
