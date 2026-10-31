import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { serverEnv } from "@/lib/env";
import { getCached, setCached } from "@/lib/db/geocode-cache";
import { waitForSlot } from "@/lib/db/throttle";
import { NominatimClient } from "./nominatim";
import { normalizeQuery } from "./normalize";
import { PlaceIndex } from "./place-index";
import type { PlacesFile } from "./places-data";
import type { Geocoder, Place } from "./types";

export type { Geocoder, Place } from "./types";

let index: PlaceIndex | null | undefined;

/** Loads data/places.json once per server instance. Null if the file is missing. */
export function getPlaceIndex(): PlaceIndex | null {
  if (index !== undefined) return index;
  const file = join(process.cwd(), "data", "places.json");
  if (!existsSync(file)) {
    console.warn("[geo] data/places.json not found — run `npm run data:places`. Type-ahead is disabled.");
    index = null;
    return index;
  }
  const data = JSON.parse(readFileSync(file, "utf8")) as PlacesFile;
  index = new PlaceIndex(data.rows);
  return index;
}

/** GeoNames list for type-ahead, Nominatim for search and reverse. */
class DefaultGeocoder implements Geocoder {
  private nominatim(): NominatimClient {
    const env = serverEnv();
    return new NominatimClient({
      baseUrl: env.NOMINATIM_BASE_URL,
      userAgent: env.NOMINATIM_USER_AGENT ?? "",
      throttle: () => waitForSlot("nominatim", 1000, 5000),
    });
  }

  async suggest(query: string, limit = 8): Promise<Place[]> {
    return getPlaceIndex()?.search(query, limit) ?? [];
  }

  async search(query: string, limit = 8): Promise<Place[]> {
    const key = `nominatim:search:${normalizeQuery(query)}:${limit}`;
    const cached = await getCached<Place[]>(key);
    if (cached) return cached;
    const results = await this.nominatim().search(query, limit);
    await setCached(key, results);
    return results;
  }

  async reverse(lat: number, lng: number): Promise<Place | null> {
    // ~1 km grid so nearby users share cache entries.
    const key = `nominatim:reverse:${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = await getCached<Place | null>(key);
    if (cached) return cached;
    const result = await this.nominatim().reverse(Number(lat.toFixed(2)), Number(lng.toFixed(2)));
    if (result) await setCached(key, result);
    return result;
  }
}

let geocoder: Geocoder | undefined;

export function getGeocoder(): Geocoder {
  geocoder ??= new DefaultGeocoder();
  return geocoder;
}
