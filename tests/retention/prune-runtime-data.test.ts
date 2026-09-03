import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as v from "valibot";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";
import { pruneRuntimeData } from "@/system/retention/prune-runtime-data";

const getDb = useIsolatedTestDatabase("retention-prune");
const seedStatements = readFileSync(join(import.meta.dir, "fixtures/seed-session.sql"), "utf8")
  .split(";")
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0);

const DateTimeRowSchema = v.object({ value: v.string() });
const SessionIdRowSchema = v.object({ id: v.string() });
const CountRowSchema = v.object({ count: v.number() });

function seedSql(index: number): string {
  const statement = seedStatements[index];
  if (!statement) {
    throw new Error(`Missing seed SQL statement at index ${index}`);
  }
  return statement;
}

function sqliteNowOffset(modifier: string): string {
  return v.parse(
    DateTimeRowSchema,
    getDb().query(`SELECT datetime('now', ?) AS value`).get(modifier),
  ).value;
}

function seedSession(createdAt: string, sessionId: string): void {
  const db = getDb();
  const versionId = `version-${sessionId}`;
  db.query(seedSql(0)).run(versionId, "cfg", "{}");
  db.query(seedSql(1)).run(sessionId, versionId, `evt-start-${sessionId}`, createdAt, createdAt);
  db.query(seedSql(2)).run(`tr-${sessionId}`, sessionId, versionId, createdAt);
  db.query(seedSql(3)).run(`evt-${sessionId}`, sessionId, createdAt, versionId, `tr-${sessionId}`);
}

describe("pruneRuntimeData", () => {
  test("deletes sessions older than retention window and keeps recent ones", () => {
    seedSession(sqliteNowOffset("-10 days"), "old");
    seedSession(sqliteNowOffset("-1 days"), "fresh");

    const result = pruneRuntimeData(getDb(), { retentionDays: 7, vacuum: false });

    expect(result.deletedSessions).toBe(1);
    expect(result.deletedTransitions).toBe(1);
    expect(result.deletedEvents).toBe(1);
    expect(result.vacuumed).toBe(false);

    const remaining = v.parse(
      v.array(SessionIdRowSchema),
      getDb().query(`SELECT id FROM sessions ORDER BY id`).all(),
    );
    expect(remaining.map((row) => row.id)).toEqual(["fresh"]);

    const versions = v.parse(
      CountRowSchema,
      getDb().query(`SELECT COUNT(*) AS count FROM funnel_versions`).get(),
    );
    expect(versions.count).toBe(3);
  });

  test("rejects non-positive retention days", () => {
    expect(() => pruneRuntimeData(getDb(), { retentionDays: 0, vacuum: false })).toThrow(
      /positive integer/,
    );
  });
});
