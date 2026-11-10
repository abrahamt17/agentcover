import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * End-to-end tests run against a production build with NO Supabase project
 * configured. That covers the public site, the demo preview, form validation
 * and, importantly, that protected routes fail closed.
 *
 * Signed-in flows need a real Supabase project and are not covered here; the
 * database rules they rely on are tested in tests/db.
 *
 * `channel` uses a browser already installed on the machine, so no browser
 * download is needed. Override with E2E_BROWSER_CHANNEL (e.g. "chrome").
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge" },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge" },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
