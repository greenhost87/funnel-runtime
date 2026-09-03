import { defineConfig, devices } from "@playwright/test";
import { getOptionalEnv } from "@/system/config/environment";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.pw.ts",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: getOptionalEnv("PLAYWRIGHT_BASE_URL") ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run scripts/start-e2e.ts",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
