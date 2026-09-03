import { readRow, readRows } from "@/system/database/read-row";
import { randomUUIDv7 } from "bun";
import type { Database } from "bun:sqlite";
import * as v from "valibot";
import type { FunnelConfig } from "@/system/funnel/config.types";

export type VersionRow = {
  id: string;
  config_id: string;
  config_json: string;
  created_at: string;
};

type ActivationRow = {
  id: number;
  version_id: string;
  activated_at: string;
};

type ActivationHistoryRow = {
  id: number;
  version_id: string;
  activated_at: string;
  config_id: string;
};

const VersionRowSchema = v.object({
  id: v.string(),
  config_id: v.string(),
  config_json: v.string(),
  created_at: v.string(),
});

const ActivationRowSchema = v.object({
  id: v.number(),
  version_id: v.string(),
  activated_at: v.string(),
});

const ActivationHistoryRowSchema = v.object({
  id: v.number(),
  version_id: v.string(),
  activated_at: v.string(),
  config_id: v.string(),
});

const ActiveVersionIdSchema = v.object({
  version_id: v.string(),
});

export function createVersionDao(db: Database) {
  function insertVersion(config: FunnelConfig): VersionRow {
    const id = randomUUIDv7();
    db.query(`INSERT INTO funnel_versions (id, config_id, config_json) VALUES (?, ?, ?)`).run(
      id,
      config.id,
      JSON.stringify(config),
    );
    const row = getVersionById(id);
    if (!row) {
      throw new Error(`Failed to insert version: ${id}`);
    }
    return row;
  }

  function getVersionById(id: string): VersionRow | null {
    return readRow(db, `SELECT * FROM funnel_versions WHERE id = ?`, id, VersionRowSchema);
  }

  function recordActivation(versionId: string): ActivationRow {
    const result = db
      .query(`INSERT INTO funnel_activation_history (version_id) VALUES (?)`)
      .run(versionId);
    const row = db
      .query(`SELECT * FROM funnel_activation_history WHERE id = ?`)
      .get(Number(result.lastInsertRowid));
    const parsed = v.parse(ActivationRowSchema, row);
    return parsed;
  }

  function getActiveVersionId(): string | null {
    const row = db
      .query(
        `SELECT version_id FROM funnel_activation_history ORDER BY activated_at DESC, id DESC LIMIT 1`,
      )
      .get();
    const parsed = v.safeParse(ActiveVersionIdSchema, row);
    return parsed.success ? parsed.output.version_id : null;
  }

  function listActivationHistory(): ActivationHistoryRow[] {
    return readRows(
      db,
      `
        SELECT h.id, h.version_id, h.activated_at, v.config_id
        FROM funnel_activation_history h
        JOIN funnel_versions v ON v.id = h.version_id
        ORDER BY h.activated_at DESC, h.id DESC
      `,
      [],
      ActivationHistoryRowSchema,
    );
  }

  return {
    insertVersion,
    getVersionById,
    recordActivation,
    getActiveVersionId,
    listActivationHistory,
  };
}
