import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { getOptionalEnv, setEnv } from "@/system/config/environment";
import { closeDatabase, getDatabase } from "@/system/database/connection";
import { runDatabaseMigrations } from "@/system/database/migrate";
import { generateSyntheticTraffic } from "@/system/generator/traffic-generator";
import { createVersionService } from "@/system/versions/version.service";

function configuredDatabasePath(): string {
  const configured = getOptionalEnv("SQLITE_PATH") ?? "data/app.sqlite";
  setEnv("SQLITE_PATH", configured);
  if (configured === ":memory:" || configured.startsWith("/")) {
    return configured;
  }
  return resolve(process.cwd(), configured);
}

function parseInteger(value: string, name: string, minimum: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`${name} must be an integer greater than or equal to ${minimum}`);
  }
  return parsed;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    seed: { type: "string", default: "42" },
    sessions: { type: "string", default: "120" },
    "version-id": { type: "string" },
    date: { type: "string" },
  },
  strict: true,
});

try {
  const sessionCount = parseInteger(values.sessions, "sessions", 100);
  const seed = parseInteger(values.seed, "seed", 0);
  if (values.date && !isIsoDate(values.date)) {
    throw new Error("date must use YYYY-MM-DD format");
  }

  const databasePath = configuredDatabasePath();
  const database = getDatabase();
  runDatabaseMigrations({ database });

  const versions = createVersionService(database);
  const versionId = values["version-id"] ?? versions.getActive()?.versionId;
  if (!versionId) {
    throw new Error("No active funnel version. Run migrations or publish a version first.");
  }
  versions.getConfigByVersionId(versionId);

  const generated = await generateSyntheticTraffic(database, {
    versionId,
    sessionCount,
    seed,
    anchorDate: values.date,
  });
  const dashboard = createAnalyticsService(database).getDashboard({ versionId });

  console.log(
    "Generated %d synthetic sessions into %s.",
    generated.generatedSessions,
    databasePath,
  );
  console.log("Version: %s", versionId);
  console.log("Summary: %s", JSON.stringify(dashboard.summary));
} catch (error) {
  console.error("%s", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  closeDatabase();
}
