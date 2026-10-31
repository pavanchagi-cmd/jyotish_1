/** Placeholder card used until a screen's phase is built. */
export function ComingSoon({ phase, what }: { phase: number; what: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card-lg border border-border bg-surface p-4">
      <div className="text-[15px] font-semibold">Coming soon</div>
      <p className="m-0 text-sm leading-normal text-muted">
        {what} will be added in build phase {phase}.
      </p>
    </div>
  );
}
