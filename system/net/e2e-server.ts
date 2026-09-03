import { getOptionalEnv, getPositiveIntegerEnv, setEnv } from "@/system/config/environment";
import { getRandomPort } from "@/system/net/random-port";

let cachedE2ePort: number | undefined;

export async function resolveE2ePort(): Promise<number> {
  const configuredBaseURL = getOptionalEnv("PLAYWRIGHT_BASE_URL");
  if (configuredBaseURL) {
    const url = new URL(configuredBaseURL);
    if (url.port) {
      return Number(url.port);
    }

    return url.protocol === "https:" ? 443 : 80;
  }

  const port = cachedE2ePort ?? getPositiveIntegerEnv("E2E_PORT") ?? (await getRandomPort());
  cachedE2ePort = port;
  setEnv("E2E_PORT", String(port));
  return port;
}
