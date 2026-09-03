import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase, resetDatabaseConnection } from "@/system/database/connection";
import { runMigrations } from "@/system/database/migrate";

let tempDir: string | null = null;
let dbPath: string | null = null;

export function createTestDatabase(): string {
  tempDir = mkdtempSync(join(tmpdir(), "funnel-runtime-test-"));
  dbPath = join(tempDir, "test.sqlite");
  process.env.SQLITE_PATH = dbPath;
  resetDatabaseConnection();
  const db = getDatabase(dbPath);
  runMigrations({ db });
  return dbPath;
}

export function destroyTestDatabase(): void {
  closeDatabase();
  resetDatabaseConnection();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
    dbPath = null;
  }
}

export function getTestDatabasePath(): string {
  if (!dbPath) {
    throw new Error("Test database not initialized");
  }
  return dbPath;
}
