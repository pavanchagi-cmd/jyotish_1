/**
 * Compact city record produced by scripts/build-places.ts from GeoNames
 * cities500 (CC BY 4.0, https://www.geonames.org/).
 *
 * Tuple layout keeps data/places.json small:
 * [geonameid, name, admin1Name, countryCode, lat, lng, population, altNames]
 */
export type PlaceRow = [
  id: number,
  name: string,
  admin1: string,
  countryCode: string,
  lat: number,
  lng: number,
  population: number,
  altNames: string[],
];

export interface PlacesFile {
  source: string;
  license: string;
  generatedAt: string;
  filter: string;
  rows: PlaceRow[];
}
