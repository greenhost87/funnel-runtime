import type { Database } from "bun:sqlite";
import { cron } from "bun";
import * as v from "valibot";
import {
  getBooleanEnv,
  getOptionalEnv,
  getPositiveIntegerEnv,
  isNodeEnvironment,
} from "@/system/config/environment";
import { logger } from "@/system/logging/logger";
import { pruneRuntimeData } from "@/system/retention/prune-runtime-data";

const RETENTION_CRON_STATE_KEY = Symbol.for("funnel-runtime.retention-cron.v1");

const RetentionCronStateSchema = v.object({
  started: v.boolean(),
});

type RetentionCronState = {
  started: boolean;
};

export type StartRetentionCronOptions = {
  getDatabase: () => Database;
};

function retentionCronState(): RetentionCronState {
  const existing: unknown = Reflect.get(globalThis, RETENTION_CRON_STATE_KEY);
  if (existing !== undefined) {
    const parsed = v.safeParse(RetentionCronStateSchema, existing);
    if (!parsed.success) {
      throw new Error("Invalid retention cron state");
    }
    return parsed.output;
  }
  const created: RetentionCronState = { started: false };
  Reflect.set(globalThis, RETENTION_CRON_STATE_KEY, created);
  return created;
}

function resolveSchedule(): string {
  return getOptionalEnv("DATA_RETENTION_CRON") ?? "0 3 * * *";
}

function resolveRetentionDays(): number {
  return getPositiveIntegerEnv("DATA_RETENTION_DAYS") ?? 7;
}

function isRetentionCronEnabled(): boolean {
  if (isNodeEnvironment("test")) {
    return false;
  }
  return getBooleanEnv("DATA_RETENTION_ENABLED", true);
}

function runRetentionPruneOnce(getDatabase: () => Database): void {
  const result = pruneRuntimeData(getDatabase(), {
    retentionDays: resolveRetentionDays(),
    vacuum: getBooleanEnv("DATA_RETENTION_VACUUM", true),
  });
  logger.info("retention.pruned", {
    deletedEvents: result.deletedEvents,
    deletedTransitions: result.deletedTransitions,
    deletedSessions: result.deletedSessions,
    vacuumed: result.vacuumed,
  });
}

/**
 * In-process daily (by default) prune via Bun.cron.
 * Idempotent across repeated bootstrap imports.
 */
export function startRetentionCron(options: StartRetentionCronOptions): void {
  const state = retentionCronState();
  if (state.started || !isRetentionCronEnabled()) {
    return;
  }

  const schedule = resolveSchedule();
  if (cron.parse(schedule) === null) {
    throw new Error(`Invalid DATA_RETENTION_CRON expression: ${schedule}`);
  }

  cron(
    schedule,
    () => {
      try {
        runRetentionPruneOnce(options.getDatabase);
      } catch (error) {
        logger.error("retention.prune_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    { tz: getOptionalEnv("DATA_RETENTION_TZ") ?? "UTC" },
  );

  state.started = true;
  logger.info("retention.cron_started", {
    schedule,
    retentionDays: resolveRetentionDays(),
  });
}
