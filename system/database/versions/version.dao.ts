import { randomUUIDv7 } from "bun";
import type { Database } from "bun:sqlite";
import type { FunnelConfig } from "@/system/funnel/config.types";

export type VersionRow = {
  id: string;
  config_id: string;
  config_json: string;
  created_at: string;
};

export type ActivationRow = {
  id: number;
  version_id: string;
  activated_at: string;
};

export class VersionDao {
  constructor(private readonly db: Database) {}

  insertVersion(config: FunnelConfig): VersionRow {
    const id = randomUUIDv7();
    this.db
      .query(`INSERT INTO funnel_versions (id, config_id, config_json) VALUES (?, ?, ?)`)
      .run(id, config.id, JSON.stringify(config));
    return this.getVersionById(id)!;
  }

  getVersionById(id: string): VersionRow | null {
    return (
      (this.db.query(`SELECT * FROM funnel_versions WHERE id = ?`).get(id) as VersionRow | null) ??
      null
    );
  }

  recordActivation(versionId: string): ActivationRow {
    const result = this.db
      .query(`INSERT INTO funnel_activation_history (version_id) VALUES (?)`)
      .run(versionId);
    const row = this.db
      .query(`SELECT * FROM funnel_activation_history WHERE id = ?`)
      .get(Number(result.lastInsertRowid)) as ActivationRow;
    return row;
  }

  getActiveVersionId(): string | null {
    const row = this.db
      .query(
        `SELECT version_id FROM funnel_activation_history ORDER BY activated_at DESC, id DESC LIMIT 1`,
      )
      .get() as { version_id: string } | null;
    return row?.version_id ?? null;
  }

  listActivationHistory(): Array<ActivationRow & { config_id: string }> {
    return this.db
      .query(
        `
        SELECT h.id, h.version_id, h.activated_at, v.config_id
        FROM funnel_activation_history h
        JOIN funnel_versions v ON v.id = h.version_id
        ORDER BY h.activated_at DESC, h.id DESC
      `,
      )
      .all() as Array<ActivationRow & { config_id: string }>;
  }
}
