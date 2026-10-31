/**
 * Geocoding contract. v1: GeoNames city list (type-ahead) + OpenStreetMap
 * Nominatim (search fallback, reverse). Google Places can replace either
 * by implementing the same interface (owner decision, 31 Oct 2026).
 */
export type PlaceSource = "geonames" | "nominatim";

export interface Place {
  /** Stable ID: "gn:<geonameid>" or "osm:<N|W|R><id>". */
  id: string;
  name: string;
  /** State / province, e.g. "Rajasthan". */
  admin1?: string;
  country: string;
  /** ISO 3166-1 alpha-2, upper case. */
  countryCode: string;
  lat: number;
  lng: number;
  source: PlaceSource;
}

export interface Geocoder {
  /** Fast type-ahead over a local list. Never calls the network. */
  suggest(query: string, limit?: number): Promise<Place[]>;
  /** Full search for places not in the local list (rate-limited upstream). */
  search(query: string, limit?: number): Promise<Place[]>;
  /** Coordinates → nearest named place (used for the Panchang location label). */
  reverse(lat: number, lng: number): Promise<Place | null>;
}

/** "Jaipur, Rajasthan, India" */
export function placeLabel(p: Pick<Place, "name" | "admin1" | "country">): string {
  return [p.name, p.admin1 && p.admin1 !== p.name ? p.admin1 : null, p.country].filter(Boolean).join(", ");
}
