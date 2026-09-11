import type { Database } from "bun:sqlite";
import { FunnelConfigSchema, parseFunnelConfig } from "@/system/funnel/config.schema";
import type { FunnelConfig } from "@/system/funnel/config.types";
import { logger } from "@/system/logging/logger";
import { createVersionService } from "@/system/versions/version.service";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";
import * as v from "valibot";

export async function parseFunnelConfigUpload(file: File): Promise<FunnelConfig> {
  return parseFunnelConfig(
    v.parse(v.pipe(v.string(), v.parseJson(), FunnelConfigSchema), await file.text()),
  );
}

export function publishParsedFunnelConfig(
  db: Database,
  config: FunnelConfig,
): ActiveVersionSnapshot {
  const active = createVersionService(db).publish(config);
  logger.info("admin.versions.publish", {
    versionId: active.versionId,
    configId: active.configId,
  });
  return active;
}

export function rollbackFunnelVersion(db: Database, versionId: string): ActiveVersionSnapshot {
  const service = createVersionService(db);
  const active = service.rollbackToVersion(versionId);
  logger.info("admin.versions.rollback", { versionId: active.versionId });
  return active;
}
