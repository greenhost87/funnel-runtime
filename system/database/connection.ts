import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getSqlitePath } from "@/system/config/environment";

const SHARED_DB_KEY = Symbol.for("funnel-runtime.database");

type SharedDbState = {
  db: Database | null;
  path: string | null;
};

function getSharedState(): SharedDbState {
  const existing = Reflect.get(globalThis, SHARED_DB_KEY) as SharedDbState | undefined;
  if (existing) {
    return existing;
  }
  const created: SharedDbState = { db: null, path: null };
  Reflect.set(globalThis, SHARED_DB_KEY, created);
  return created;
}

function openDatabase(path: string): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function getDatabase(customPath?: string): Database {
  const path = customPath ?? getSqlitePath();
  const state = getSharedState();
  if (state.db && state.path === path) {
    return state.db;
  }
  if (state.db) {
    state.db.close();
  }
  const db = openDatabase(path);
  state.db = db;
  state.path = path;
  return db;
}

export function closeDatabase(): void {
  const state = getSharedState();
  if (state.db) {
    state.db.close();
    state.db = null;
    state.path = null;
  }
}

export function resetDatabaseConnection(): void {
  closeDatabase();
}
