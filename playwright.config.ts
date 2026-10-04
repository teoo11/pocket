import { defineConfig, devices } from "@playwright/test"

// A production build on its own port: no dev overlay, no first-visit compiles, and `npm run dev` can keep running.
const PORT = Number(process.env.E2E_PORT ?? 3100)

export default defineConfig({
  testDir: "./e2e",
  // Resets the test accounts (scripts/e2e-users.ts) so every run starts from sign-in and onboarding.
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  // The dev server compiles each page on first visit, which can take a while.
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    timezoneId: "Europe/Bucharest",
    // Software WebGL, so Google's vector maps render in headless Chromium as they do for real visitors.
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
