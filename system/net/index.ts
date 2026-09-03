import { createServer } from "node:net";
import { getOptionalEnv, getPositiveIntegerEnv, setEnv } from "@/system/config/environment";

async function getRandomPort(host = "127.0.0.1"): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        if (!address || typeof address === "string") {
          reject(new Error("Failed to resolve ephemeral port"));
          return;
        }

        resolve(address.port);
      });
    });
  });
}

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
