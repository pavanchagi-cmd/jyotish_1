import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { keepCity, parseAdmin1, parseCityLine, pickAltNames, toRow } from "./geonames-build";
import { PlaceIndex } from "./place-index";
import { normalizeQuery } from "./normalize";
import { placeLabel } from "./types";

const dir = "tests/fixtures/geonames";
const admin1 = parseAdmin1(readFileSync(`${dir}/admin1CodesASCII.txt`, "utf8"));
const cities = readFileSync(`${dir}/cities500.txt`, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => parseCityLine(l)!);
const rows = cities.filter(keepCity).map((c) => toRow(c, admin1));
const index = new PlaceIndex(rows);

describe("GeoNames build helpers", () => {
  it("parses every fixture line", () => {
    expect(cities).toHaveLength(11);
    expect(cities[0]).toMatchObject({ name: "Jaipur", countryCode: "IN", admin1Code: "24", population: 3000000 });
  });

  it("keeps all of India and only big cities elsewhere", () => {
    const kept = cities.filter(keepCity).map((c) => c.name);
    expect(kept).toContain("Testpur"); // pop 600, India
    expect(kept).toContain("London");
    expect(kept).not.toContain("Smalltown"); // pop 5000, UK
    expect(kept).not.toContain("Some Hill"); // not a populated place
  });

  it("keeps Latin alternate names only", () => {
    const blr = cities.find((c) => c.name === "Bengaluru")!;
    expect(pickAltNames(blr)).toEqual(["Bangalore"]);
    const sp = cities.find((c) => c.name === "São Paulo")!;
    // "Sao Paulo" is dropped: it normalizes to the same key as "São Paulo".
    expect(pickAltNames(sp)).toEqual(["Sampa"]);
  });

  it("resolves state names", () => {
    expect(toRow(cities[0]!, admin1)[2]).toBe("Rajasthan");
  });
});

describe("PlaceIndex", () => {
  it("suggests by prefix", () => {
    expect(index.search("jai").map((p) => p.name)).toEqual(["Jaipur", "Jaisalmer"]);
  });

  it("matches old names such as Bangalore and Bombay", () => {
    expect(index.search("bangal")[0]?.name).toBe("Bengaluru");
    expect(index.search("bombay")[0]?.name).toBe("Mumbai");
  });

  it("ranks India first for same-name cities", () => {
    const r = index.search("hyderabad");
    expect(r.map((p) => p.countryCode)).toEqual(["IN", "PK"]);
  });

  it("filters by state or country after a comma", () => {
    expect(index.search("hyderabad, pak").map((p) => p.countryCode)).toEqual(["PK"]);
    expect(index.search("jaipur, rajasthan")[0]?.name).toBe("Jaipur");
  });

  it("ignores accents", () => {
    expect(index.search("sao pa")[0]?.name).toBe("São Paulo");
  });

  it("needs at least two characters", () => {
    expect(index.search("j")).toEqual([]);
  });

  it("returns full place records", () => {
    const p = index.search("jaipur")[0]!;
    expect(p).toMatchObject({ id: "gn:9000001", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873, source: "geonames" });
    expect(placeLabel(p)).toBe("Jaipur, Rajasthan, India");
  });
});

describe("normalizeQuery", () => {
  it("lower-cases and strips punctuation", () => {
    expect(normalizeQuery("  São-Paulo,  BR ")).toBe("sao paulo br");
  });
});
