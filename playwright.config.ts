import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + accessibility (spec section 10): onboarding → home → each tab at 390px
 * and 1280px, axe with zero serious violations. Runs against a production
 * build without Supabase/DB env, with API responses mocked per test.
 *   npm run build && npm run test:e2e
 */
const PORT = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "mobile-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // No Supabase/DB env: pages render their signed-out/unconfigured states; APIs are mocked.
    env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", DATABASE_URL: "" },
  },
});
