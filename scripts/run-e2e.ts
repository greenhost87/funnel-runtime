import { spawn as bunSpawn } from "bun";
import { createEnv, getOptionalEnv, setEnv } from "@/system/config/environment";
import { resolveE2ePort } from "@/system/net/e2e-server";

const e2ePort = getOptionalEnv("E2E_PORT") ?? String(await resolveE2ePort());
setEnv("E2E_PORT", e2ePort);

const build = bunSpawn(["bun", "--bun", "next", "build"], {
  cwd: process.cwd(),
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const buildCode = await build.exited;
if (buildCode !== 0) {
  process.exit(buildCode);
}

const test = bunSpawn(["bunx", "playwright", "test", ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: createEnv({ E2E_PORT: e2ePort }),
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

process.exit(await test.exited);
