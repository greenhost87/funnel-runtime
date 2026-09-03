import { cron } from "bun";
import {
  getBooleanEnv,
  getOptionalEnv,
  getPositiveIntegerEnv,
  getRequiredEnv,
  isNodeEnvironment,
} from "@/system/config/environment";
import { normalizeBasePath } from "@/system/config/base-path";

if (!isNodeEnvironment("production")) {
  throw new Error("NODE_ENV must be production");
}

getRequiredEnv("SQLITE_PATH");
getRequiredEnv("ADMIN_PASSWORD");
getRequiredEnv("ADMIN_SIGNING_SECRET");

const appUrl = new URL(getRequiredEnv("APP_URL"));
const basePath = normalizeBasePath(getOptionalEnv("BASE_PATH"));

if (basePath) {
  const urlPath = normalizeBasePath(appUrl.pathname);
  if (urlPath !== basePath) {
    throw new Error(`APP_URL path "${appUrl.pathname}" must match BASE_PATH "${basePath}"`);
  }
}

getPositiveIntegerEnv("DATA_RETENTION_DAYS");
getBooleanEnv("DATA_RETENTION_ENABLED", true);
getBooleanEnv("DATA_RETENTION_VACUUM", true);
const retentionCron = getOptionalEnv("DATA_RETENTION_CRON");
if (retentionCron && cron.parse(retentionCron) === null) {
  throw new Error(`Invalid DATA_RETENTION_CRON expression: ${retentionCron}`);
}

console.log("Production environment is valid");
