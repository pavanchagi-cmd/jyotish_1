/**
 * Builds data/places.json from GeoNames (CC BY 4.0).
 *
 *   npm run data:places                 # downloads from download.geonames.org
 *   npm run data:places -- --dir ./dl   # uses cities500.zip (or .txt) + admin1CodesASCII.txt in ./dl
 *
 * Keeps every populated place in India plus world cities with population ≥ 100,000.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { keepCity, parseAdmin1, parseCityLine, toRow, WORLD_MIN_POPULATION } from "../lib/geo/geonames-build";
import type { PlacesFile } from "../lib/geo/places-data";

const BASE = "https://download.geonames.org/export/dump";

async function download(name: string): Promise<Uint8Array> {
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`Download failed: ${name} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

async function loadCities(dir: string | null): Promise<string> {
  if (dir) {
    const txt = join(dir, "cities500.txt");
    if (existsSync(txt)) return readFileSync(txt, "utf8");
    return unzipText(new Uint8Array(readFileSync(join(dir, "cities500.zip"))));
  }
  return unzipText(await download("cities500.zip"));
}

function unzipText(zip: Uint8Array): string {
  const files = unzipSync(zip, { filter: (f) => f.name === "cities500.txt" });
  const data = files["cities500.txt"];
  if (!data) throw new Error("cities500.txt not found in zip");
  return strFromU8(data);
}

async function loadAdmin1(dir: string | null): Promise<string> {
  if (dir) return readFileSync(join(dir, "admin1CodesASCII.txt"), "utf8");
  return strFromU8(await download("admin1CodesASCII.txt"));
}

async function main() {
  const dirFlag = process.argv.indexOf("--dir");
  const dir = dirFlag > -1 ? resolve(process.argv[dirFlag + 1] ?? ".") : null;

  const [citiesText, admin1Text] = await Promise.all([loadCities(dir), loadAdmin1(dir)]);
  const admin1 = parseAdmin1(admin1Text);

  const rows = [];
  for (const line of citiesText.split("\n")) {
    const city = line ? parseCityLine(line) : null;
    if (city && keepCity(city)) rows.push(toRow(city, admin1));
  }
  rows.sort((a, b) => b[6] - a[6]);

  const out: PlacesFile = {
    source: "GeoNames cities500 + admin1CodesASCII (https://www.geonames.org/)",
    license: "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)",
    generatedAt: new Date().toISOString(),
    filter: `country IN, or population >= ${WORLD_MIN_POPULATION}`,
    rows,
  };
  mkdirSync("data", { recursive: true });
  writeFileSync("data/places.json", JSON.stringify(out));
  const inCount = rows.filter((r) => r[3] === "IN").length;
  console.log(`Wrote data/places.json: ${rows.length} places (${inCount} in India).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
