import { file } from "bun";
import { join } from "node:path";
import {
  closeDatabase,
  getDatabase,
  getDatabaseGeneration,
  installDatabaseForTests,
  releaseDatabaseForTests,
} from "@/system/database/connection";
import { runDatabaseMigrations } from "@/system/database/migrate";
import { createVersionDao } from "@/system/database/versions/version.dao";
import { FunnelConfigSchema, parseFunnelConfig } from "@/system/funnel/config.schema";
import { createVersionService } from "@/system/versions/version.service";
import * as v from "valibot";

const raw: unknown = await file(join(process.cwd(), "fixtures/funnels/initial.json")).json();
const initialConfig = parseFunnelConfig(v.parse(FunnelConfigSchema, raw));

const db = getDatabase();
const generationAtStart = getDatabaseGeneration();
runDatabaseMigrations({ database: db });
if (getDatabaseGeneration() !== generationAtStart) {
  throw new Error("Database generation changed during seed migrations");
}
const connectionLifecycle = {
  generation: getDatabaseGeneration,
  install: installDatabaseForTests,
  release: releaseDatabaseForTests,
};
if (connectionLifecycle.generation() < 0) {
  connectionLifecycle.install(db);
  connectionLifecycle.release();
}

const activeId = createVersionDao(db).getActiveVersionId();
if (!activeId) {
  const service = createVersionService(db);
  service.publish(initialConfig);
  console.log("Seeded initial funnel config");
} else {
  console.log("Database already seeded, skipping");
}

closeDatabase();
