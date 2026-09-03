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

const { values: parsedValues } = parseArgs({
  args: argv.slice(2),
  options: {
    seed: { type: "string", default: "42" },
    sessions: { type: "string", default: "120" },
    versionId: { type: "string" },
    "version-id": { type: "string" },
    withAlternative: { type: "boolean", default: false },
    "with-alternative": { type: "boolean", default: false },
  },
  strict: false,
  allowNegative: true,
});

const values: {
  seed?: string;
  sessions?: string;
  versionId?: string;
  withAlternative?: boolean;
} = {
  seed: typeof parsedValues.seed === "string" ? parsedValues.seed : undefined,
  sessions: typeof parsedValues.sessions === "string" ? parsedValues.sessions : undefined,
  versionId:
    typeof parsedValues.versionId === "string"
      ? parsedValues.versionId
      : typeof parsedValues["version-id"] === "string"
        ? parsedValues["version-id"]
        : undefined,
  withAlternative:
    Boolean(parsedValues.withAlternative) || Boolean(parsedValues["with-alternative"]),
};

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
let generatedSessions: number;

function generateSplitSessions(
  database: ReturnType<typeof getDatabase>,
  firstVersionId: string,
  totalSessions: number,
  seedValue: number,
): number {
  const versionSplit = Math.floor(totalSessions / 2);
  const firstBatch = generateSyntheticTraffic(database, {
    versionId: firstVersionId,
    sessionCount: versionSplit,
    seed: seedValue,
  });
  const secondVersionId = versions.publish(alternativeConfig).versionId;
  const secondBatch = generateSyntheticTraffic(database, {
    versionId: secondVersionId,
    sessionCount: totalSessions - versionSplit,
    seed: seedValue + 10_000,
  });
  return firstBatch.generatedSessions + secondBatch.generatedSessions;
}

if (values.versionId) {
  try {
    versions.getConfigByVersionId(values.versionId);
  } catch {
    console.error("Unknown versionId: %s", values.versionId);
    process.exit(1);
  }
  const result = generateSyntheticTraffic(db, {
    versionId: values.versionId,
    sessionCount,
    seed,
  });
  generatedSessions = result.generatedSessions;
} else {
  const active = versions.getActive();
  if (active) {
    if (values.withAlternative) {
      generatedSessions = generateSplitSessions(db, active.versionId, sessionCount, seed);
    } else {
      const result = generateSyntheticTraffic(db, {
        versionId: active.versionId,
        sessionCount,
        seed,
      });
      generatedSessions = result.generatedSessions;
    }
  } else {
    const firstVersionId = versions.publish(initialConfig).versionId;
    generatedSessions = generateSplitSessions(db, firstVersionId, sessionCount, seed);
  }
}

const appUrl = getOptionalEnv("APP_URL") ?? "http://localhost:3000";
console.log("Generated %d synthetic sessions into %s.", generatedSessions, dbPath);
console.log("Open %s/admin to view the dashboard.", appUrl);

closeDatabase();
