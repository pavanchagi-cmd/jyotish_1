import { norm360 } from "./math";
import { NAKSHATRAS, NAKSHATRA_SPAN, PADA_SPAN, type NakshatraInfo } from "./tables/nakshatras";

export interface NakshatraPosition extends NakshatraInfo {
  /** 0 = Ashwini … 26 = Revati */
  index: number;
  /** 1–4 */
  pada: number;
  /** 0–1, how far through the nakshatra the longitude is. */
  fraction: number;
}

export function nakshatraOf(longitude: number): NakshatraPosition {
  const lon = norm360(longitude);
  const index = Math.min(26, Math.floor(lon / NAKSHATRA_SPAN));
  const within = lon - index * NAKSHATRA_SPAN;
  const pada = Math.min(4, Math.floor(within / PADA_SPAN) + 1);
  return { ...NAKSHATRAS[index]!, index, pada, fraction: within / NAKSHATRA_SPAN };
}
