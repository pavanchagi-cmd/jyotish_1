import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const JAIPUR = { id: "gn:1", name: "Jaipur", admin1: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873, source: "geonames" };

export const PANCHANG = {
  panchang: {
    date: "2026-10-31",
    zone: "Asia/Kolkata",
    sunrise: "2026-10-31T00:42:56.280Z",
    sunset: "2026-10-31T12:23:23.260Z",
    vara: { index: 6, name: "Shanivara" },
    tithi: { index: 21, name: "Shashthi", paksha: "Krishna", endsAt: "2026-10-31T11:28:19.175Z" },
    nakshatra: { index: 6, name: "Ardra", pada: 4, endsAt: "2026-10-31T01:42:06.459Z" },
    yoga: { index: 21, name: "Siddha", endsAt: "2026-10-31T12:01:32.014Z" },
    karana: { index: 42, name: "Vanija", endsAt: "2026-10-31T11:28:19.175Z" },
    rahuKaal: { start: "2026-10-31T03:38:03.025Z", end: "2026-10-31T05:05:36.397Z" },
    abhijit: { start: "2026-10-31T06:09:48.870Z", end: "2026-10-31T06:56:30.669Z", avoidOnWednesday: false },
    atSunrise: true,
  },
};

/** Mocks the API routes the signed-out pages call. */
export async function mockApis(page: Page) {
  await page.route("**/api/panchang**", (r) => r.fulfill({ json: PANCHANG }));
  await page.route("**/api/places/suggest**", (r) => r.fulfill({ json: { results: [JAIPUR] } }));
  await page.route("**/api/places/resolve", (r) => {
    const b = r.request().postDataJSON();
    r.fulfill({
      json: { lat: b.lat, lng: b.lng, zone: "Asia/Kolkata", offsetSeconds: 19800, offsetLabel: "UTC +05:30", zoneAbbreviation: "IST", isDst: false, status: "ok", needsOffsetChoice: false },
    });
  });
  await page.route("**/api/profiles", (r) => r.fulfill({ status: 201, json: { profile: {} } }));
}

/** Spec section 10: zero serious (or critical) axe violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
}
