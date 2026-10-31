import "server-only";
import { find } from "geo-tz/all";

/**
 * IANA zone for a coordinate. Uses geo-tz's "all" dataset, which keeps zones
 * that differ before 1970 apart — needed for births back to 1900.
 */
export function zoneForCoordinates(lat: number, lng: number): string {
  const zones = find(lat, lng);
  const zone = zones[0];
  if (!zone) throw new Error(`No time zone found for ${lat}, ${lng}`);
  return zone;
}
