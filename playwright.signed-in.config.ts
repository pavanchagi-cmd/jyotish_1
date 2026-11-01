import { defineConfig, devices } from "@playwright/test";
import { MOCK_SUPABASE_URL } from "./tests/e2e-signed-in/session";

/**
 * Signed-in E2E: a stand-in Supabase Auth server plus a real Postgres
 * (TEST_DATABASE_URL, wiped). The app must be built with the same
 * NEXT_PUBLIC_SUPABASE_* values, because Next.js inlines them at build time:
 *   npm run build:e2e-signed-in && npm run test:e2e-signed-in
 */
const PORT = 3300;

export default defineConfig({
  testDir: "tests/e2e-signed-in",
  globalSetup: "./tests/e2e-signed-in/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "mobile-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: [
    {
      command: "node tests/e2e-signed-in/mock-supabase.mjs",
      port: 54329,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: `npx next start -p ${PORT}`,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      },
    },
  ],
});
