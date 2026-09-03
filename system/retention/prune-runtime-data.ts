import type { Database } from "bun:sqlite";

export type PruneRuntimeDataOptions = {
  retentionDays: number;
  vacuum: boolean;
};

export type PruneRuntimeDataResult = {
  deletedEvents: number;
  deletedSessions: number;
  deletedTransitions: number;
  vacuumed: boolean;
};

function assertRetentionDays(retentionDays: number): void {
  if (!Number.isSafeInteger(retentionDays) || retentionDays < 1) {
    throw new Error(`retentionDays must be a positive integer, got: ${retentionDays}`);
  }
}

/**
 * Deletes funnel runtime traffic older than `retentionDays`.
 * Keeps funnel_versions / activation history.
 */
export function pruneRuntimeData(
  db: Database,
  options: PruneRuntimeDataOptions,
): PruneRuntimeDataResult {
  assertRetentionDays(options.retentionDays);
  const ageModifier = `-${options.retentionDays} days`;

  const deleteEvents = db.query(`
    DELETE FROM events
    WHERE session_id IN (
      SELECT id FROM sessions WHERE created_at < datetime('now', ?)
    )
  `);
  const deleteTransitions = db.query(`
    DELETE FROM session_transitions
    WHERE session_id IN (
      SELECT id FROM sessions WHERE created_at < datetime('now', ?)
    )
  `);
  const deleteSessions = db.query(`
    DELETE FROM sessions
    WHERE created_at < datetime('now', ?)
  `);

  const tx = db.transaction(() => {
    const events = deleteEvents.run(ageModifier);
    const transitions = deleteTransitions.run(ageModifier);
    const sessions = deleteSessions.run(ageModifier);
    return {
      deletedEvents: events.changes,
      deletedTransitions: transitions.changes,
      deletedSessions: sessions.changes,
    };
  });

  const deleted = tx();
  let vacuumed = false;
  if (options.vacuum) {
    db.run("VACUUM");
    vacuumed = true;
  }

  return { ...deleted, vacuumed };
}
