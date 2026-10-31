export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="m-0 font-heading text-[26px] font-bold">{title}</h1>
      {subtitle ? <div className="text-sm text-muted">{subtitle}</div> : null}
    </div>
  );
}
