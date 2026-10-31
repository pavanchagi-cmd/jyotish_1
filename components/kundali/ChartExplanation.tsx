"use client";

import { ErrorRetry, SkeletonLines } from "@/components/Skeleton";
import { useJson } from "@/lib/client/useJson";
import type { KundaliExplanation } from "@/lib/llm/schemas";

function Para({ title, meaning, example }: { title: string; meaning: string; example: string }) {
  return (
    <p className="m-0 text-sm leading-[1.55] text-text-soft">
      <b className="text-warm-text">{title}.</b> {meaning} {example}
    </p>
  );
}

/** "Your chart in simple words" (design/Kundali.html). */
export function ChartExplanation({ profileId, lang = "en" }: { profileId: string; lang?: string }) {
  const [state, retry] = useJson<{ explanation: KundaliExplanation }>(`/api/chart/${profileId}/explain`);
  return (
    <section aria-labelledby="explain-title" aria-live="polite" lang={lang} className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5">
      <h2 id="explain-title" className="m-0 font-heading text-xl font-bold">
        Your chart in simple words
      </h2>
      {state.status === "loading" ? (
        <SkeletonLines lines={5} label="Explaining your chart" />
      ) : state.status === "error" ? (
        <ErrorRetry message={state.message} onRetry={retry} />
      ) : (
        <>
          {state.data.explanation.lagna ? <Para {...state.data.explanation.lagna} /> : null}
          <Para {...state.data.explanation.moon} />
          {state.data.explanation.highlights.map((h) => (
            <Para key={h.title} {...h} />
          ))}
        </>
      )}
    </section>
  );
}
