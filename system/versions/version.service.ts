import type { Database } from "bun:sqlite";
import { parseFunnelConfig } from "@/system/funnel/config.schema";
import type { FunnelConfig } from "@/system/funnel/config.types";
import { VersionDao } from "@/system/database/versions/version.dao";

export type ActiveVersionSnapshot = {
  versionId: string;
  config: FunnelConfig;
  configId: string;
  createdAt: string;
  activatedAt: string;
};

export type ActivationHistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

export class VersionService {
  private readonly dao: VersionDao;

  constructor(db: Database) {
    this.dao = new VersionDao(db);
  }

  publish(configInput: unknown): ActiveVersionSnapshot {
    const config = parseFunnelConfig(configInput);
    return this.dbTransaction(() => {
      const version = this.dao.insertVersion(config);
      const activation = this.dao.recordActivation(version.id);
      return this.toSnapshot(version, activation.activated_at);
    });
  }

  getActive(): ActiveVersionSnapshot | null {
    const versionId = this.dao.getActiveVersionId();
    if (!versionId) {
      return null;
    }
    const version = this.dao.getVersionById(versionId);
    if (!version) {
      return null;
    }
    const history = this.dao.listActivationHistory();
    const active = history[0];
    return this.toSnapshot(version, active?.activated_at ?? version.created_at);
  }

  getHistory(): ActivationHistoryItem[] {
    const activeId = this.dao.getActiveVersionId();
    return this.dao.listActivationHistory().map((row) => ({
      activationId: row.id,
      versionId: row.version_id,
      configId: row.config_id,
      activatedAt: row.activated_at,
      isActive: row.version_id === activeId,
    }));
  }

  rollbackToVersion(versionId: string): ActiveVersionSnapshot {
    const version = this.dao.getVersionById(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    return this.dbTransaction(() => {
      const activation = this.dao.recordActivation(versionId);
      return this.toSnapshot(version, activation.activated_at);
    });
  }

  getConfigByVersionId(versionId: string): FunnelConfig {
    const version = this.dao.getVersionById(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    return parseFunnelConfig(JSON.parse(version.config_json));
  }

  private toSnapshot(
    version: { id: string; config_id: string; config_json: string; created_at: string },
    activatedAt: string,
  ): ActiveVersionSnapshot {
    return {
      versionId: version.id,
      configId: version.config_id,
      config: parseFunnelConfig(JSON.parse(version.config_json)),
      createdAt: version.created_at,
      activatedAt,
    };
  }

  private dbTransaction<T>(fn: () => T): T {
    const db = (this.dao as unknown as { db: Database }).db;
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
