import { defineConfig, devices } from "@playwright/test";
import { getOptionalEnv, getPositiveIntegerEnv } from "@/system/config/environment";

function resolvePlaywrightPort(): number {
  const configuredBaseURL = getOptionalEnv("PLAYWRIGHT_BASE_URL");
  if (configuredBaseURL) {
    const url = new URL(configuredBaseURL);
    if (url.port) {
      return Number(url.port);
    }

    return url.protocol === "https:" ? 443 : 80;
  }

  return getPositiveIntegerEnv("E2E_PORT", true);
}

const port = resolvePlaywrightPort();
const baseURL = getOptionalEnv("PLAYWRIGHT_BASE_URL") ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.pw.ts",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run scripts/start-e2e.ts",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PORT: String(port),
      E2E_PORT: String(port),
    },
  },
});
