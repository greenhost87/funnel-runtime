import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Database } from "bun:sqlite";
import { getDatabase } from "./connection";

function listMigrationFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
}

function ensureLedger(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function getAppliedMigrations(db: Database): Set<string> {
  ensureLedger(db);
  const rows = db.query("SELECT name FROM schema_migrations").all() as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

export function runMigrations(options?: { db?: Database; dir?: string }): void {
  const db = options?.db ?? getDatabase();
  const migrationsDir = resolve(process.cwd(), options?.dir ?? "migrations");
  const files = listMigrationFiles(migrationsDir);
  const applied = getAppliedMigrations(db);

  for (const fileName of files) {
    if (applied.has(fileName)) {
      continue;
    }
    const sql = readFileSync(join(migrationsDir, fileName), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.query("INSERT INTO schema_migrations (name) VALUES (?)").run(fileName);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
