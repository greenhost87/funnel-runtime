import { spawn as bunSpawn } from "bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createEnv, getBooleanEnv, getOptionalEnv, setEnv } from "@/system/config/environment";
import { resolveE2ePort } from "@/system/net";

const e2ePort = getOptionalEnv("E2E_PORT") ?? String(await resolveE2ePort());
setEnv("E2E_PORT", e2ePort);

const rawArgs = process.argv.slice(2);
const forceBuild = getBooleanEnv("E2E_FORCE_BUILD", false) || rawArgs.includes("--build");
const testArgs = rawArgs.filter((argument) => argument !== "--build");

function hasProductionBuild(): boolean {
  const distDir = getOptionalEnv("NEXT_DIST_DIR") ?? ".next";
  return existsSync(join(distDir, "BUILD_ID"));
}

async function runProductionBuild(): Promise<number> {
  const build = bunSpawn(["bun", "--bun", "next", "build"], {
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  return build.exited;
}

if (forceBuild || !hasProductionBuild()) {
  const buildCode = await runProductionBuild();
  if (buildCode !== 0) {
    process.exit(buildCode);
  }
} else {
  console.log(
    "Reusing existing .next build for e2e. Set E2E_FORCE_BUILD=1 or pass --build to rebuild.",
  );
}

const test = bunSpawn(["bunx", "playwright", "test", ...testArgs], {
  cwd: process.cwd(),
  env: createEnv({ E2E_PORT: e2ePort }),
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

process.exit(await test.exited);
