"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface SavedProfile {
  id: string;
  name: string;
  summary: string;
  isPrimary: boolean;
}

export function SavedProfiles({ profiles }: { profiles: SavedProfile[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(p: SavedProfile) {
    if (!window.confirm(`Remove ${p.name}'s birth details? This also removes matches with them.`)) return;
    setBusy(p.id);
    setError(null);
    const res = await fetch(`/api/profiles/${p.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(null);
    if (!res?.ok) setError("Could not remove. Please try again.");
    else router.refresh();
  }

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {profiles.map((p, i) => (
        <li key={p.id} className={`flex items-center justify-between gap-3 py-2.5 ${i < profiles.length - 1 ? "border-b border-divider" : ""}`}>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">
              {p.name}
              {p.isPrimary ? <span className="ml-2 text-xs font-normal text-muted">You</span> : null}
            </div>
            <div className="truncate text-[13px] text-muted">{p.summary}</div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Link href={p.isPrimary ? "/kundali" : `/kundali?profile=${p.id}`} className="flex min-h-11 items-center px-2 text-sm font-semibold">
              Kundali
            </Link>
            {!p.isPrimary ? (
              <button type="button" onClick={() => remove(p)} disabled={busy === p.id} className="min-h-11 px-2 text-sm font-semibold text-warm-text disabled:opacity-60">
                {busy === p.id ? "Removing…" : "Remove"}
              </button>
            ) : null}
          </div>
        </li>
      ))}
      {error ? (
        <li role="alert" className="pt-2 text-sm text-warm-text">
          {error}
        </li>
      ) : null}
    </ul>
  );
}
