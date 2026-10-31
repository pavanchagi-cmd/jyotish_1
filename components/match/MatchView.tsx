"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorRetry, SkeletonLines } from "@/components/Skeleton";
import { useJson } from "@/lib/client/useJson";
import type { MatchSummary } from "@/lib/llm/schemas";

export interface MatchProfile {
  id: string;
  name: string;
  gender: "female" | "male" | "other" | null;
  moon: string;
}

interface MatchResponse {
  match: {
    id: string;
    total: number;
    kootas: { name: string; points: number; max: number }[];
    doshas: { bhakoot: { present: boolean; lordsSameOrFriends: boolean }; nadi: { present: boolean } };
    manglik: { girl: ManglikJson; boy: ManglikJson };
  };
  approximate: boolean;
}
interface ManglikJson {
  manglik: boolean;
  fromLagna: { house: number } | null;
  fromMoon: { house: number };
}

const KOOTA_LABELS: Record<string, [string, string]> = {
  varna: ["Varna", "work nature"],
  vashya: ["Vashya", "mutual attraction"],
  tara: ["Tara", "health & luck"],
  yoni: ["Yoni", "physical comfort"],
  grahaMaitri: ["Graha Maitri", "friendship"],
  gana: ["Gana", "temperament"],
  bhakoot: ["Bhakoot", "family welfare"],
  nadi: ["Nadi", "health & children"],
};

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function manglikText(m: ManglikJson) {
  const h = m.fromLagna?.house ?? m.fromMoon.house;
  return `${m.manglik ? "Yes" : "No"} · Mars in ${ordinal(h)}${m.fromLagna ? "" : " from Moon"}`;
}

function ScoreRing({ total }: { total: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <svg role="img" aria-label={`${fmt(total)} of 36 gunas matched`} width="104" height="104" viewBox="0 0 104 104" className="shrink-0">
      <circle cx="52" cy="52" r={r} fill="none" stroke="#3A3466" strokeWidth="10" />
      <circle
        cx="52"
        cy="52"
        r={r}
        fill="none"
        stroke="#F5A524"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(total / 36) * c} ${c}`}
        transform="rotate(-90 52 52)"
      />
      <text x="52" y="54" textAnchor="middle" fontFamily="var(--font-philosopher), Georgia, serif" fontSize="28" fontWeight="700" fill="#F4F1FF">
        {fmt(total)}
      </text>
      <text x="52" y="72" textAnchor="middle" fontSize="12" fill="#B8B3D6">
        of 36
      </text>
    </svg>
  );
}

function PersonCard({ role, options, value, onChange }: { role: "Girl" | "Boy"; options: MatchProfile[]; value: string; onChange: (id: string) => void }) {
  const selected = options.find((o) => o.id === value);
  const id = `pick-${role}`;
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-border bg-surface p-3">
      <label htmlFor={id} className="text-xs text-muted">
        {role}
      </label>
      {options.length ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-border bg-bg px-2 text-base font-semibold text-text"
        >
          <option value="">Choose…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      ) : null}
      <div className="text-[13px] text-muted">{selected ? `Moon: ${selected.moon}` : "Add birth details"}</div>
    </div>
  );
}

/** Kundali Milan screen body (design/Match.html). */
export function MatchView({ profiles }: { profiles: MatchProfile[] }) {
  const firstOf = (g: MatchProfile["gender"]) => profiles.find((p) => p.gender === g)?.id ?? "";
  const [girlId, setGirlId] = useState(firstOf("female"));
  const [boyId, setBoyId] = useState(firstOf("male"));
  const [result, setResult] = useState<{ key: string; data?: MatchResponse; error?: string } | null>(null);
  const pairKey = girlId && boyId && girlId !== boyId ? `${girlId}:${boyId}` : null;
  const current = result && result.key === pairKey ? result : null;

  useEffect(() => {
    if (!pairKey) return;
    const ctrl = new AbortController();
    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ girlProfileId: girlId, boyProfileId: boyId }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const body = await res.json();
        setResult(res.ok ? { key: pairKey, data: body } : { key: pairKey, error: body.error ?? "Could not match." });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ key: pairKey, error: "Could not connect." });
      });
    return () => ctrl.abort();
  }, [pairKey, girlId, boyId]);

  const [summaryState, retrySummary] = useJson<{ summary: MatchSummary }>(current?.data ? `/api/match/${current.data.match.id}/summary` : null);
  const summary = summaryState.status === "ready" ? summaryState.data.summary : null;
  const m = current?.data?.match;
  const doshaNote = (name: string) => summary?.doshaNotes.find((n) => n.name.toLowerCase().includes(name));

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <PersonCard role="Girl" options={profiles} value={girlId} onChange={setGirlId} />
        <PersonCard role="Boy" options={profiles} value={boyId} onChange={setBoyId} />
      </div>
      <Link href="/onboarding?add=partner" className="flex min-h-11 items-center self-start text-sm font-semibold">
        + Add a partner’s birth details
      </Link>
      {girlId && boyId && girlId === boyId ? <p className="m-0 text-sm text-warm-text">Choose two different people.</p> : null}

      {pairKey && !current ? <div aria-busy="true" className="h-32 animate-pulse rounded-card-lg bg-surface" /> : null}
      {current?.error ? <p role="alert" className="m-0 text-sm text-warm-text">{current.error}</p> : null}

      {m ? (
        <>
          <section className="flex items-center gap-4 rounded-card-lg border border-border bg-surface p-4">
            <ScoreRing total={m.total} />
            <div className="flex flex-col gap-1" aria-live="polite">
              {summaryState.status === "loading" ? (
                <SkeletonLines lines={3} label="Explaining your match" />
              ) : summaryState.status === "error" ? (
                <>
                  <div className="font-heading text-[21px] font-bold text-warm-text">{m.total >= 18 ? "Acceptable score" : "Below 18"}</div>
                  <ErrorRetry message={summaryState.message} onRetry={retrySummary} />
                </>
              ) : (
                <>
                  <div className="font-heading text-[21px] font-bold text-warm-text">{summary!.verdict}</div>
                  <p className="m-0 text-sm leading-normal text-text-soft">{summary!.summary}</p>
                </>
              )}
            </div>
          </section>

          <section aria-labelledby="kootas-title" className="flex flex-col gap-3 rounded-card-lg border border-border bg-surface px-4 py-3.5">
            <h2 id="kootas-title" className="m-0 font-heading text-xl font-bold">
              The 8 kootas, simply explained
            </h2>
            {m.kootas.map((k) => {
              const [name, gloss] = KOOTA_LABELS[k.name] ?? [k.name, ""];
              const zero = k.points === 0;
              return (
                <div key={k.name} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>
                      <b>{name}</b> · {gloss}
                    </span>
                    <span className={zero ? "font-semibold text-warm-text" : ""}>
                      {fmt(k.points)} / {k.max}
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={`${name}: ${fmt(k.points)} of ${k.max}`}
                    aria-valuemin={0}
                    aria-valuemax={k.max}
                    aria-valuenow={k.points}
                    className="h-1.5 rounded-sm bg-border"
                  >
                    <div className="h-1.5 rounded-sm bg-accent" style={{ width: `${(k.points / k.max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </section>

          {[
            ["bhakoot", "Bhakoot dosha", m.doshas.bhakoot.present],
            ["nadi", "Nadi dosha", m.doshas.nadi.present],
          ]
            .filter(([, , present]) => present)
            .map(([key, title]) => {
              const note = doshaNote(key as string);
              return (
                <section key={key as string} className="flex flex-col gap-1.5 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3.5">
                  <h2 className="m-0 text-[15px] font-semibold text-warm-text">{title as string}: what it means</h2>
                  {note ? (
                    <p className="m-0 text-sm leading-normal text-warm-soft">
                      {note.meaning} {note.example} {note.tip}
                    </p>
                  ) : summaryState.status === "loading" ? (
                    <SkeletonLines lines={2} />
                  ) : (
                    <p className="m-0 text-sm text-warm-soft">Talk this through with a trusted astrologer; many consider cancellations.</p>
                  )}
                </section>
              );
            })}

          <dl className="m-0 grid grid-cols-2 gap-2.5 rounded-[14px] border border-border bg-surface px-4 py-3">
            <div>
              <dt className="text-xs text-muted">Manglik (girl)</dt>
              <dd className="m-0 text-[15px] font-semibold">{manglikText(m.manglik.girl)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Manglik (boy)</dt>
              <dd className="m-0 text-[15px] font-semibold">{manglikText(m.manglik.boy)}</dd>
            </div>
          </dl>
          {current?.data?.approximate ? (
            <p className="m-0 text-xs text-muted">One birth time is missing, so Manglik is checked from the Moon.</p>
          ) : null}

          <button
            type="button"
            disabled
            title="Coming in a later version"
            className="flex h-[50px] items-center justify-center rounded-[14px] bg-accent text-base font-semibold text-accent-ink opacity-50"
          >
            Get detailed report
          </button>
        </>
      ) : null}
    </>
  );
}
