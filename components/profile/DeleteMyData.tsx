"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** "Delete my data" (spec section 9) with an explicit second confirmation. */
export function DeleteMyData() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me", { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      setError("Could not delete. Please try again.");
      return;
    }
    router.replace("/login?deleted=1");
    router.refresh();
  }

  return (
    <section aria-labelledby="delete-title" className="flex flex-col gap-2 rounded-card border border-warm-border bg-warm-surface px-4 py-3.5">
      <h2 id="delete-title" className="m-0 text-[15px] font-semibold text-warm-text">
        Delete my data
      </h2>
      <p className="m-0 text-sm leading-normal text-warm-soft">
        Removes your birth details, every saved profile, charts, matches and readings, and your sign-in account. This cannot be undone.
      </p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="min-h-11 self-start text-sm font-semibold text-warm-text underline">
          Delete my data…
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={confirmDelete}
            disabled={busy}
            className="h-11 rounded-input bg-warm-text px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Yes, delete everything"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="h-11 rounded-input border border-warm-border px-4 text-sm text-warm-soft">
            Cancel
          </button>
        </div>
      )}
      {error ? (
        <p role="alert" className="m-0 text-sm text-warm-text">
          {error}
        </p>
      ) : null}
    </section>
  );
}
