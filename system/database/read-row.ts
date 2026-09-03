import type { Database } from "bun:sqlite";
import * as v from "valibot";

export function readRow<const TSchema extends v.GenericSchema>(
  db: Database,
  sql: string,
  param: string,
  schema: TSchema,
): v.InferOutput<TSchema> | null {
  const row = db.query(sql).get(param);
  const parsed = v.safeParse(schema, row);
  return parsed.success ? parsed.output : null;
}

export function readRows<const TSchema extends v.GenericSchema>(
  db: Database,
  sql: string,
  params: string[],
  schema: TSchema,
): v.InferOutput<TSchema>[] {
  const rows = db.query(sql).all(...params);
  return rows.flatMap((row) => {
    const parsed = v.safeParse(schema, row);
    return parsed.success ? [parsed.output] : [];
  });
}

export function rowExists(db: Database, sql: string, ...params: string[]): boolean {
  return db.query(sql).get(...params) !== null;
}
