import { argv } from "bun";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { getOptionalEnv, setEnv } from "@/system/config/environment";
import { closeDatabase, getDatabase } from "@/system/database/connection";
import { runDatabaseMigrations } from "@/system/database/migrate";
import { generateSyntheticTraffic } from "@/system/generator/traffic-generator";
import { createVersionService } from "@/system/versions/version.service";

function configuredDatabasePath(): string {
  let configured = getOptionalEnv("SQLITE_PATH");
  if (!configured) {
    configured = "data/app.sqlite";
    setEnv("SQLITE_PATH", configured);
  }
  if (configured === ":memory:" || configured.startsWith("/")) {
    return configured;
  }
  return resolve(process.cwd(), configured);
}

const { values } = parseArgs({
  args: argv.slice(2),
  options: {
    seed: { type: "string", default: "42" },
    sessions: { type: "string", default: "120" },
  },
});

const seed = Number(values.seed);
const sessionCount = Number(values.sessions);
if (!Number.isFinite(sessionCount) || sessionCount < 100) {
  console.error("generate:traffic requires at least 100 sessions");
  process.exit(1);
}

const dbPath = configuredDatabasePath();
const db = getDatabase();
runDatabaseMigrations({ database: db });

const versions = createVersionService(db);
const firstVersionId =
  versions.getActive()?.versionId ?? versions.publish(initialConfig).versionId;

const versionSplit = Math.floor(sessionCount / 2);
const firstBatch = generateSyntheticTraffic(db, {
  versionId: firstVersionId,
  sessionCount: versionSplit,
  seed,
});
const secondVersionId = versions.publish(alternativeConfig).versionId;
const secondBatch = generateSyntheticTraffic(db, {
  versionId: secondVersionId,
  sessionCount: sessionCount - versionSplit,
  seed: seed + 10_000,
});
const generatedSessions = firstBatch.generatedSessions + secondBatch.generatedSessions;

const appUrl = getOptionalEnv("APP_URL") ?? "http://localhost:3000";
console.log("Generated %d synthetic sessions into %s.", generatedSessions, dbPath);
console.log("Open %s/admin to view the dashboard.", appUrl);

closeDatabase();
