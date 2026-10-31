import { normalizeQuery } from "./normalize";
import type { PlaceRow } from "./places-data";

/**
 * Pure helpers used by scripts/build-places.ts to turn GeoNames dump files
 * into data/places.json. Column layout from
 * https://download.geonames.org/export/dump/readme.txt
 */

/** Cities outside India are kept only from this population up ("major world cities"). */
export const WORLD_MIN_POPULATION = 100_000;
export const ALWAYS_KEEP_COUNTRIES = new Set(["IN"]);
export const MAX_ALT_NAMES = 6;

/** admin1CodesASCII.txt: "IN.24<TAB>Rajasthan<TAB>Rajasthan<TAB>1258899" → Map("IN.24" → "Rajasthan") */
export function parseAdmin1(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [code, name] = line.split("\t");
    if (code && name) map.set(code, name);
  }
  return map;
}

export interface CityLine {
  id: number;
  name: string;
  asciiName: string;
  altNames: string[];
  lat: number;
  lng: number;
  featureClass: string;
  countryCode: string;
  admin1Code: string;
  population: number;
}

/** One line of cities500.txt (19 tab-separated columns). Returns null if malformed. */
export function parseCityLine(line: string): CityLine | null {
  const c = line.split("\t");
  if (c.length < 19) return null;
  const id = Number(c[0]);
  const lat = Number(c[4]);
  const lng = Number(c[5]);
  const population = Number(c[14] || 0);
  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id,
    name: c[1] ?? "",
    asciiName: c[2] ?? "",
    altNames: c[3] ? c[3].split(",") : [],
    lat,
    lng,
    featureClass: c[6] ?? "",
    countryCode: c[8] ?? "",
    admin1Code: c[10] ?? "",
    population: Number.isFinite(population) ? population : 0,
  };
}

export function keepCity(city: CityLine): boolean {
  if (city.featureClass !== "P") return false;
  return ALWAYS_KEEP_COUNTRIES.has(city.countryCode) || city.population >= WORLD_MIN_POPULATION;
}

const LATIN_ONLY = /^[\p{Script=Latin}\s'.-]+$/u;

/**
 * Keeps short Latin-script alternate names (e.g. "Bangalore" for Bengaluru,
 * "Bombay" for Mumbai) that differ from the main and ASCII names.
 */
export function pickAltNames(city: CityLine): string[] {
  const seen = new Set([normalizeQuery(city.name), normalizeQuery(city.asciiName)]);
  const out: string[] = [];
  for (const alt of city.altNames) {
    const a = alt.trim();
    if (a.length < 3 || a.length > 40 || !LATIN_ONLY.test(a)) continue;
    const key = normalizeQuery(a);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= MAX_ALT_NAMES) break;
  }
  if (normalizeQuery(city.asciiName) !== normalizeQuery(city.name) && city.asciiName) {
    out.unshift(city.asciiName);
  }
  return out;
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

export function toRow(city: CityLine, admin1: Map<string, string>): PlaceRow {
  return [
    city.id,
    city.name,
    admin1.get(`${city.countryCode}.${city.admin1Code}`) ?? "",
    city.countryCode,
    round4(city.lat),
    round4(city.lng),
    city.population,
    pickAltNames(city),
  ];
}
