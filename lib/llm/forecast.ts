import { HEALTH_DISCLAIMER, type ForecastYear } from "./schemas";

/** Years shown: the current calendar year and the next four (spec section 7). */
export function forecastYears(now: Date, zone: string): number[] {
  const y = Number(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric" }).format(now));
  return [y, y + 1, y + 2, y + 3, y + 4];
}

/** Applies code-level guarantees to a generated year: requested year, health disclaimer last. */
export function finaliseForecast(year: number, f: ForecastYear): ForecastYear {
  const health = f.areas.health;
  const summary = health.summary.includes(HEALTH_DISCLAIMER) ? health.summary : `${health.summary.trim()} ${HEALTH_DISCLAIMER}`;
  return { ...f, year, areas: { ...f.areas, health: { ...health, summary } } };
}
