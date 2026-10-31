import { normalizeQuery } from "./normalize";
import type { PlaceRow } from "./places-data";
import type { Place } from "./types";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

interface Entry {
  row: PlaceRow;
  name: string;
  alts: string[];
  /** "rajasthan india in" — matched by the part after a comma. */
  region: string;
}

/**
 * In-memory type-ahead over the GeoNames list. A linear scan of ~15k entries
 * takes a few milliseconds, which is fine per keystroke.
 */
export class PlaceIndex {
  private readonly entries: Entry[];

  constructor(rows: PlaceRow[], private readonly preferCountry = "IN") {
    this.entries = rows.map((row) => ({
      row,
      name: normalizeQuery(row[1]),
      alts: row[7].map(normalizeQuery),
      region: normalizeQuery(`${row[2]} ${countryName(row[3])} ${row[3]}`),
    }));
  }

  get size(): number {
    return this.entries.length;
  }

  search(query: string, limit = 8): Place[] {
    const [cityPart = "", ...rest] = query.split(",");
    const q = normalizeQuery(cityPart);
    const regionQ = normalizeQuery(rest.join(" "));
    if (q.length < 2) return [];

    const scored: { e: Entry; score: number }[] = [];
    for (const e of this.entries) {
      let score: number | null = null;
      if (e.name === q) score = 0;
      else if (e.name.startsWith(q)) score = 1;
      else if (e.alts.some((a) => a === q)) score = 2;
      else if (e.alts.some((a) => a.startsWith(q))) score = 3;
      if (score === null) continue;
      if (regionQ && !e.region.split(" ").some((w) => w.startsWith(regionQ)) && !e.region.startsWith(regionQ)) {
        continue;
      }
      scored.push({ e, score });
    }

    scored.sort(
      (a, b) =>
        a.score - b.score ||
        Number(b.e.row[3] === this.preferCountry) - Number(a.e.row[3] === this.preferCountry) ||
        b.e.row[6] - a.e.row[6],
    );

    return scored.slice(0, limit).map(({ e }) => rowToPlace(e.row));
  }
}

export function rowToPlace(row: PlaceRow): Place {
  const [id, name, admin1, countryCode, lat, lng] = row;
  return {
    id: `gn:${id}`,
    name,
    admin1: admin1 || undefined,
    country: countryName(countryCode),
    countryCode,
    lat,
    lng,
    source: "geonames",
  };
}
