import { z } from "zod";
import type { Place } from "./types";
import { countryName } from "./place-index";

/**
 * OpenStreetMap Nominatim client.
 * Usage policy (https://operations.osmfoundation.org/policies/nominatim/):
 * max 1 request/second for the whole app, an identifying User-Agent, cache
 * results, and no as-you-type autocomplete — so it is only called when the
 * user taps "Search". Results are © OpenStreetMap contributors (ODbL).
 */

const addressSchema = z
  .object({
    city: z.string().optional(),
    town: z.string().optional(),
    village: z.string().optional(),
    hamlet: z.string().optional(),
    suburb: z.string().optional(),
    county: z.string().optional(),
    state_district: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
  })
  .partial();

const resultSchema = z.object({
  osm_type: z.string().optional(),
  osm_id: z.union([z.number(), z.string()]).optional(),
  place_id: z.union([z.number(), z.string()]).optional(),
  lat: z.string(),
  lon: z.string(),
  name: z.string().optional(),
  display_name: z.string().optional(),
  address: addressSchema.optional(),
});

export type NominatimResult = z.infer<typeof resultSchema>;

export interface NominatimOptions {
  baseUrl: string;
  userAgent: string;
  /** Waits for this app's next 1-second slot; throws if the queue is too long. */
  throttle: () => Promise<void>;
  fetchFn?: typeof fetch;
}

export class NominatimError extends Error {}

export function toPlace(r: NominatimResult): Place | null {
  const lat = Number(r.lat);
  const lng = Number(r.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const a = r.address ?? {};
  const name =
    a.city ?? a.town ?? a.village ?? a.hamlet ?? r.name ?? a.suburb ?? a.county ?? r.display_name?.split(",")[0]?.trim();
  if (!name) return null;
  const cc = (a.country_code ?? "").toUpperCase();
  const typeLetter = (r.osm_type ?? "").charAt(0).toUpperCase();
  const id = r.osm_id !== undefined && typeLetter ? `osm:${typeLetter}${r.osm_id}` : `osm:p${r.place_id ?? `${lat},${lng}`}`;
  return {
    id,
    name,
    admin1: a.state ?? a.state_district,
    country: a.country ?? (cc ? countryName(cc) : ""),
    countryCode: cc,
    lat: Math.round(lat * 1e4) / 1e4,
    lng: Math.round(lng * 1e4) / 1e4,
    source: "nominatim",
  };
}

export class NominatimClient {
  private readonly fetchFn: typeof fetch;

  constructor(private readonly opts: NominatimOptions) {
    if (!opts.userAgent) throw new NominatimError("NOMINATIM_USER_AGENT is not set");
    this.fetchFn = opts.fetchFn ?? fetch;
  }

  private async get(path: string, params: Record<string, string>): Promise<unknown> {
    await this.opts.throttle();
    const url = new URL(path, this.opts.baseUrl);
    for (const [k, v] of Object.entries({ format: "jsonv2", addressdetails: "1", "accept-language": "en", ...params })) {
      url.searchParams.set(k, v);
    }
    const res = await this.fetchFn(url, {
      headers: { "User-Agent": this.opts.userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new NominatimError(`Nominatim returned ${res.status}`);
    return res.json();
  }

  async search(query: string, limit = 8): Promise<Place[]> {
    const data = await this.get("/search", { q: query, limit: String(limit) });
    const parsed = z.array(resultSchema).safeParse(data);
    if (!parsed.success) throw new NominatimError("Unexpected Nominatim response");
    const seen = new Set<string>();
    const places: Place[] = [];
    for (const r of parsed.data) {
      const p = toPlace(r);
      if (!p || seen.has(p.id)) continue;
      seen.add(p.id);
      places.push(p);
    }
    return places;
  }

  async reverse(lat: number, lng: number): Promise<Place | null> {
    // zoom 10 ≈ city level.
    const data = await this.get("/reverse", { lat: String(lat), lon: String(lng), zoom: "10" });
    const parsed = resultSchema.safeParse(data);
    return parsed.success ? toPlace(parsed.data) : null;
  }
}
