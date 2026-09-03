import { spawn as bunSpawn } from "bun";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEnv, getBooleanEnv, getPositiveIntegerEnv } from "@/system/config/environment";
import { resolveE2ePort } from "@/system/net";

const tempDir = mkdtempSync(join(tmpdir(), "funnel-e2e-"));
const dbPath = join(tempDir, "e2e.sqlite");

const port = getPositiveIntegerEnv("PORT") ?? (await resolveE2ePort());
const productionMode = getBooleanEnv("NODE_ENV_PRODUCTION", true);

const env = createEnv({
  SQLITE_PATH: dbPath,
  ADMIN_PASSWORD: "e2e-admin",
  ADMIN_SIGNING_SECRET: "e2e-signing-secret-with-length",
  APP_URL: `http://127.0.0.1:${port}`,
  NODE_ENV: productionMode ? "production" : "development",
  PORT: String(port),
  HOSTNAME: "127.0.0.1",
});

await bunSpawn(["bun", "run", "scripts/migrate.ts"], {
  cwd: process.cwd(),
  env,
  stdout: "inherit",
  stderr: "inherit",
}).exited;

await bunSpawn(["bun", "run", "scripts/seed.ts"], {
  cwd: process.cwd(),
  env,
  stdout: "inherit",
  stderr: "inherit",
}).exited;

const server = bunSpawn(["bun", "--bun", "next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  cwd: process.cwd(),
  env,
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

function cleanup() {
  server.kill();
  rmSync(tempDir, { recursive: true, force: true });
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

void server.exited.then((code) => {
  cleanup();
  process.exit(code);
});

// Keep the launcher alive while the Next.js server runs.
await new Promise<void>(() => {});
