"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** "Saturday, 31 October" in the viewer's own time zone (rendered on the client). */
export function TodayLabel() {
  const label = useSyncExternalStore(
    subscribe,
    () => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    () => "",
  );
  return <div className="min-h-5 text-sm text-muted">{label}</div>;
}
