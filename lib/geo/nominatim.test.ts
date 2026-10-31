import { describe, expect, it, vi } from "vitest";
import { NominatimClient, NominatimError, toPlace } from "./nominatim";

const sample = [
  {
    place_id: 1,
    osm_type: "relation",
    osm_id: 123,
    lat: "26.91234",
    lon: "75.78731",
    name: "Jaipur",
    display_name: "Jaipur, Rajasthan, India",
    address: { city: "Jaipur", state: "Rajasthan", country: "India", country_code: "in" },
  },
];

function client(fetchFn: typeof fetch, throttle = vi.fn(async () => {})) {
  return { throttle, c: new NominatimClient({ baseUrl: "https://nominatim.example", userAgent: "Jyotish/test (a@b.c)", throttle, fetchFn }) };
}

describe("NominatimClient", () => {
  it("sends an identifying User-Agent and waits for the throttle", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(sample))) as unknown as typeof fetch;
    const { c, throttle } = client(fetchFn);
    const places = await c.search("jaipur");
    expect(throttle).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchFn as unknown as { mock: { calls: [URL, RequestInit][] } }).mock.calls[0]!;
    expect(String(url)).toContain("/search?");
    expect(url.searchParams.get("q")).toBe("jaipur");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect((init.headers as Record<string, string>)["User-Agent"]).toBe("Jyotish/test (a@b.c)");
    expect(places).toEqual([
      { id: "osm:R123", name: "Jaipur", admin1: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9123, lng: 75.7873, source: "nominatim" },
    ]);
  });

  it("refuses to run without a User-Agent", () => {
    expect(
      () => new NominatimClient({ baseUrl: "https://x.example", userAgent: "", throttle: async () => {} }),
    ).toThrow(NominatimError);
  });

  it("surfaces HTTP errors", async () => {
    const fetchFn = vi.fn(async () => new Response("busy", { status: 429 })) as unknown as typeof fetch;
    await expect(client(fetchFn).c.search("x")).rejects.toThrow(NominatimError);
  });

  it("does not call upstream when the throttle refuses", async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch;
    const throttle = vi.fn(async () => {
      throw new Error("busy");
    });
    await expect(client(fetchFn, throttle).c.search("x")).rejects.toThrow("busy");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("toPlace", () => {
  it("falls back from city to town to village", () => {
    const p = toPlace({ lat: "1", lon: "2", osm_type: "node", osm_id: 9, address: { village: "Chhota Gaon", state: "Bihar", country: "India", country_code: "in" } });
    expect(p).toMatchObject({ id: "osm:N9", name: "Chhota Gaon", admin1: "Bihar" });
  });
  it("rejects bad coordinates", () => {
    expect(toPlace({ lat: "x", lon: "2", name: "a" })).toBeNull();
  });
});
