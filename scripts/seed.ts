import { readFileSync } from "node:fs";
import { join } from "node:path";
import { closeDatabase, getDatabase, resetDatabaseConnection } from "@/system/database/connection";
import { runMigrations } from "@/system/database/migrate";
import { VersionDao } from "@/system/database/versions/version.dao";
import { parseFunnelConfig } from "@/system/funnel/config.schema";
import { VersionService } from "@/system/versions/version.service";

const initialConfig = parseFunnelConfig(
  JSON.parse(readFileSync(join(process.cwd(), "fixtures/funnels/initial.json"), "utf8")),
);

const db = getDatabase();
runMigrations({ db });

const activeId = new VersionDao(db).getActiveVersionId();
if (!activeId) {
  const service = new VersionService(db);
  service.publish(initialConfig);
  console.log("Seeded initial funnel config");
} else {
  console.log("Database already seeded, skipping");
}

closeDatabase();
resetDatabaseConnection();
