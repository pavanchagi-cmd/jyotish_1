/**
 * Shown instantly while a screen loads on the server (the bottom navigation
 * stays visible), so tapping a tile or tab always gives feedback.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <div className="h-8 w-48 animate-pulse rounded bg-surface" />
      <div className="h-4 w-64 animate-pulse rounded bg-surface" />
      <div className="h-64 animate-pulse rounded-card-lg bg-surface" />
      <div className="h-32 animate-pulse rounded-card-lg bg-surface" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
