import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./session";

// Signed in, with a saved profile: every Explore card and bottom-nav tab must open its page.
const PAGES = [
  { card: "My Kundali", tab: "Kundali", path: "/kundali", heading: "My Kundali" },
  { card: "Kundali Milan", tab: "Match", path: "/match", heading: "Kundali Milan" },
  { card: "Dasha & transits", tab: "Dasha", path: "/dasha", heading: "Dasha & transits" },
  { card: "5-year forecast", tab: "Forecast", path: "/forecast", heading: "Your next 5 years" },
] as const;

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!);
});

async function openHome(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Namaste, Ananya", level: 1 })).toBeVisible();
}

for (const p of PAGES) {
  test(`Explore card "${p.card}" opens ${p.path}`, async ({ page }) => {
    await openHome(page);
    await page.getByRole("main").getByRole("link", { name: new RegExp(`^${p.card.replace(/[&]/g, "\\&")}`) }).click();
    await expect(page).toHaveURL(p.path);
    await expect(page.getByRole("heading", { name: p.heading, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Setup needed|Something went wrong/ })).toHaveCount(0);
  });
}

test("bottom nav tabs open each page and back to Home", async ({ page }) => {
  await openHome(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const p of PAGES) {
    await nav.getByRole("link", { name: p.tab, exact: true }).click();
    await expect(page).toHaveURL(p.path);
    await expect(page.getByRole("heading", { name: p.heading, level: 1 })).toBeVisible();
    await expect(nav.getByRole("link", { name: p.tab, exact: true })).toHaveAttribute("aria-current", "page");
  }
  await nav.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Namaste, Ananya", level: 1 })).toBeVisible();
});
