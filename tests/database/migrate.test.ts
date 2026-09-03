import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

const TableRowSchema = v.object({
  name: v.string(),
});

describe("database migrations", () => {
  test("applies migrations on isolated sqlite template", () => {
    const db = currentDatabase();
    const rows = db.query(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`).all();
    const tables = rows.flatMap((row) => {
      const parsed = v.safeParse(TableRowSchema, row);
      return parsed.success ? [parsed.output] : [];
    });
    expect(tables.some((table) => table.name === "sessions")).toBe(true);
    expect(tables.some((table) => table.name === "events")).toBe(true);
    expect(tables.some((table) => table.name === "schema_migrations")).toBe(true);
  });
});
