/** Loading placeholder lines while Gemini responds (spec section 7). */
export function SkeletonLines({ lines = 3, label = "Loading" }: { lines?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-bg" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-1">
      <p className="m-0 text-sm text-warm-text">{message}</p>
      <button type="button" onClick={onRetry} className="min-h-11 text-sm font-semibold text-accent">
        Try again
      </button>
    </div>
  );
}
