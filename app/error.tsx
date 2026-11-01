"use client";

import Link from "next/link";

/**
 * Friendly error screen for server errors in any page (usually a database or
 * setup problem). Points the owner to /api/health for the exact cause.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-4 px-5 pt-10 pb-8">
      <div className="font-heading text-[22px] font-bold text-accent">Jyotish</div>
      <h1 className="m-0 font-heading text-[26px] font-bold">Something went wrong</h1>
      <p className="m-0 text-[15px] leading-normal text-muted">
        We couldn’t load this page. Please try again in a moment.
      </p>
      <div className="rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm leading-normal text-warm-soft">
        Site owner: open{" "}
        <a href="/api/health" className="font-semibold underline">
          /api/health
        </a>{" "}
        to see which setting or database step needs fixing.
        {error.digest ? <div className="mt-1 text-xs text-muted">Error reference: {error.digest}</div> : null}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="h-12 flex-1 rounded-[14px] bg-accent text-base font-semibold text-accent-ink">
          Try again
        </button>
        <Link href="/login" className="flex h-12 flex-1 items-center justify-center rounded-[14px] border border-border bg-surface text-base text-text no-underline hover:text-text">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
