import type { Database } from "bun:sqlite";
import { FunnelConfigSchema, parseFunnelConfig } from "@/system/funnel/config.schema";
import type { FunnelConfig } from "@/system/funnel/config.types";
import { createVersionDao, type VersionRow } from "@/system/database/versions/version.dao";
import { parseJsonString, type JsonValue } from "@/system/http/json";

export type ActiveVersionSnapshot = {
  versionId: string;
  config: FunnelConfig;
  configId: string;
  createdAt: string;
  activatedAt: string;
};

type ActivationHistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

export function createVersionService(db: Database) {
  const dao = createVersionDao(db);

  function toSnapshot(version: VersionRow, activatedAt: string): ActiveVersionSnapshot {
    return {
      versionId: version.id,
      configId: version.config_id,
      config: parseFunnelConfig(parseJsonString(version.config_json, FunnelConfigSchema)),
      createdAt: version.created_at,
      activatedAt,
    };
  }

  function dbTransaction<T>(fn: () => T): T {
    db.run("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.run("COMMIT");
      return result;
    } catch (error) {
      db.run("ROLLBACK");
      throw error;
    }
  }

  function publish(configInput: JsonValue): ActiveVersionSnapshot {
    const config = parseFunnelConfig(configInput);
    return dbTransaction(() => {
      const version = dao.insertVersion(config);
      const activation = dao.recordActivation(version.id);
      return toSnapshot(version, activation.activated_at);
    });
  }

  function getActive(): ActiveVersionSnapshot | null {
    const versionId = dao.getActiveVersionId();
    if (!versionId) {
      return null;
    }
    const version = dao.getVersionById(versionId);
    if (!version) {
      return null;
    }
    const history = dao.listActivationHistory();
    const active = history[0];
    return toSnapshot(version, active?.activated_at ?? version.created_at);
  }

  function getHistory(): ActivationHistoryItem[] {
    const activeId = dao.getActiveVersionId();
    return dao.listActivationHistory().map((row) => ({
      activationId: row.id,
      versionId: row.version_id,
      configId: row.config_id,
      activatedAt: row.activated_at,
      isActive: row.version_id === activeId,
    }));
  }

  function rollbackToVersion(versionId: string): ActiveVersionSnapshot {
    const version = dao.getVersionById(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    return dbTransaction(() => {
      const activation = dao.recordActivation(versionId);
      return toSnapshot(version, activation.activated_at);
    });
  }

  function getConfigByVersionId(versionId: string): FunnelConfig {
    const version = dao.getVersionById(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    return parseFunnelConfig(parseJsonString(version.config_json, FunnelConfigSchema));
  }

  return {
    publish,
    getActive,
    getHistory,
    rollbackToVersion,
    getConfigByVersionId,
  };
}
