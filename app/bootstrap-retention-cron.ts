import { getOptionalEnv, isNodeEnvironment } from "@/system/config/environment";
import { getDatabase } from "@/system/database/connection";
import { logger } from "@/system/logging/logger";
import { startRetentionCron } from "@/system/retention/start-retention-cron";

function shouldStartRetentionCron(): boolean {
  if (isNodeEnvironment("test")) {
    return false;
  }
  if (getOptionalEnv("NEXT_PHASE") === "phase-production-build") {
    return false;
  }
  if (getOptionalEnv("NEXT_RUNTIME") === "edge") {
    return false;
  }
  return true;
}

if (shouldStartRetentionCron()) {
  logger.info("app.bootstrap", { component: "retention-cron" });
  startRetentionCron({ getDatabase });
}
