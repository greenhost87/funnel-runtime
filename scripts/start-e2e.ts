import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "funnel-e2e-"));
const dbPath = join(tempDir, "e2e.sqlite");

process.env = {
  ...process.env,
  SQLITE_PATH: dbPath,
  ADMIN_PASSWORD: "e2e-admin",
  ADMIN_SIGNING_SECRET: "e2e-signing-secret-with-length",
  APP_URL: "http://127.0.0.1:3000",
  NODE_ENV: "production",
  NEXT_DIST_DIR: ".next-e2e",
  PORT: "3000",
  HOSTNAME: "127.0.0.1",
};

await Bun.spawn(["bun", "run", "scripts/migrate.ts"], {
  cwd: process.cwd(),
  env: process.env,
  stdout: "inherit",
  stderr: "inherit",
}).exited;

await Bun.spawn(["bun", "run", "scripts/seed.ts"], {
  cwd: process.cwd(),
  env: process.env,
  stdout: "inherit",
  stderr: "inherit",
}).exited;

let child: ChildProcess | null = spawn(
  "bun",
  ["--bun", "next", "start", "-p", "3000", "-H", "127.0.0.1"],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);

function cleanup() {
  if (child) {
    child.kill("SIGTERM");
    child = null;
  }
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

child.on("exit", (code) => {
  cleanup();
  process.exit(code ?? 1);
});

// Keep the launcher alive while the Next.js server runs.
await new Promise<void>(() => {});
