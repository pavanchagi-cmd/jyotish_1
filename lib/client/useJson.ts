"use client";

import { useCallback, useEffect, useState } from "react";

export type JsonState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

/** Fetches JSON for a URL (null = don't fetch), with a retry function. */
export function useJson<T>(url: string | null): [JsonState<T>, () => void] {
  const [attempt, setAttempt] = useState(0);
  const key = url ? `${url}#${attempt}` : null;
  const [state, setState] = useState<{ key: string; value: JsonState<T> } | null>(null);

  useEffect(() => {
    if (!url || !key) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        setState({
          key,
          value: res.ok ? { status: "ready", data: body as T } : { status: "error", message: (body as { error?: string }).error ?? "Something went wrong." },
        });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ key, value: { status: "error", message: "Could not connect. Please check your internet." } });
      });
    return () => ctrl.abort();
  }, [url, key]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return [state && state.key === key ? state.value : { status: "loading" }, retry];
}
