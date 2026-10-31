import { expect, test } from "@playwright/test";
import { expectAccessible, mockApis } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

test("onboarding → home → each tab", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Your birth details" })).toBeVisible();
  await expectAccessible(page);

  await page.getByLabel("Full name").fill("Ananya Sharma");
  await page.getByRole("button", { name: "Female", exact: true }).click();
  await page.getByLabel("Date of birth").fill("1995-08-14");
  await page.getByLabel("Exact time of birth").fill("06:42");
  await page.getByRole("combobox", { name: "Place of birth" }).fill("jai");
  await page.getByRole("option", { name: /Jaipur/ }).click();
  await expect(page.getByText("IST · UTC +05:30")).toBeVisible();
  await page.getByRole("checkbox").check();
  await expectAccessible(page);

  const saved = page.waitForRequest((r) => r.url().endsWith("/api/profiles") && r.method() === "POST");
  await page.getByRole("button", { name: "Generate my Kundali" }).click();
  const body = (await saved).postDataJSON();
  expect(body).toMatchObject({ fullName: "Ananya Sharma", date: "1995-08-14", time: "06:42", consent: true, offsetChoice: { kind: "auto" } });

  await page.waitForURL("/");
  await expect(page.getByText("Shanivara").first()).toBeVisible();
  await expectAccessible(page);

  for (const [tab, heading] of [
    ["Kundali", "My Kundali"],
    ["Match", "Kundali Milan"],
    ["Dasha", "Dasha & transits"],
    ["Forecast", "Your next 5 years"],
    ["Home", "Namaste"],
  ] as const) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: tab, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: tab, exact: true })).toHaveAttribute("aria-current", "page");
    await expectAccessible(page);
  }
});

test("onboarding validation errors are announced and accessible", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Generate my Kundali" }).click();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
  await expectAccessible(page);
});

test("full-day Panchang, login and privacy pages", async ({ page }) => {
  await page.goto("/panchang?lat=12.97&lng=77.59&label=Bengaluru");
  await expect(page.getByText("Abhijit Muhurta")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy notice" })).toBeVisible();
  await expectAccessible(page);
});

test("no horizontal scroll", async ({ page }) => {
  for (const path of ["/", "/onboarding", "/panchang", "/privacy"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
