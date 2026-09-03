import { describe, expect, test } from "bun:test";
import { getDatabase } from "@/system/database/connection";
import { runMigrations } from "@/system/database/migrate";
import { createTestDatabase, destroyTestDatabase } from "@/tests/setup/test-database";

describe("database migrations", () => {
  test("applies migrations idempotently on temp sqlite", () => {
    createTestDatabase();
    const db = getDatabase();
    runMigrations({ db });
    runMigrations({ db });
    const tables = db
      .query(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .all() as Array<{ name: string }>;
    expect(tables.some((table) => table.name === "sessions")).toBe(true);
    expect(tables.some((table) => table.name === "events")).toBe(true);
    destroyTestDatabase();
  });
});
