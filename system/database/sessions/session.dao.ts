import { readRow, rowExists } from "@/system/database/read-row";
import { randomUUIDv7 } from "bun";
import type { Database } from "bun:sqlite";
import * as v from "valibot";
import type { FunnelAnswers, FunnelVariant } from "@/system/funnel/config.types";

export type SessionRow = {
  id: string;
  version_id: string;
  variant: FunnelVariant;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  answers_json: string;
  current_step_id: string | null;
  is_result: number;
  history_json: string;
  session_started_event_id: string;
  session_started_recorded: number;
  created_at: string;
  updated_at: string;
};

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

export type SessionStateUpdate = {
  answers: FunnelAnswers;
  currentStepId: string | null;
  isResult: boolean;
  history: string[];
};

export type SessionStateExpectation = {
  currentStepId: string | null;
  isResult: boolean;
};

type CreateSessionInput = {
  versionId: string;
  variant: FunnelVariant;
  utm: UtmParams;
  sessionStartedEventId: string;
  currentStepId: string;
  history: string[];
};

type InsertTransitionInput = {
  transitionId: string;
  sessionId: string;
  versionId: string;
  variant: FunnelVariant;
  fromStepId: string;
  toStepId: string | null;
  toResult: boolean;
};

type TransitionRow = {
  transition_id: string;
  session_id: string;
  version_id: string;
  variant: FunnelVariant;
  from_step_id: string;
  to_step_id: string | null;
  to_result: number;
};

const SessionRowSchema = v.object({
  id: v.string(),
  version_id: v.string(),
  variant: v.picklist(["A", "B"]),
  utm_source: v.nullable(v.string()),
  utm_medium: v.nullable(v.string()),
  utm_campaign: v.nullable(v.string()),
  utm_term: v.nullable(v.string()),
  utm_content: v.nullable(v.string()),
  answers_json: v.string(),
  current_step_id: v.nullable(v.string()),
  is_result: v.number(),
  history_json: v.string(),
  session_started_event_id: v.string(),
  session_started_recorded: v.number(),
  created_at: v.string(),
  updated_at: v.string(),
});

const TransitionRowSchema = v.object({
  transition_id: v.string(),
  session_id: v.string(),
  version_id: v.string(),
  variant: v.picklist(["A", "B"]),
  from_step_id: v.string(),
  to_step_id: v.nullable(v.string()),
  to_result: v.number(),
});

function buildStateUpdateParams(
  sessionId: string,
  update: SessionStateUpdate,
  expected?: SessionStateExpectation,
): (string | number | null)[] {
  const params: (string | number | null)[] = [
    JSON.stringify(update.answers),
    update.currentStepId,
    update.isResult ? 1 : 0,
    JSON.stringify(update.history),
    sessionId,
  ];
  if (expected) {
    params.push(expected.currentStepId, expected.isResult ? 1 : 0);
  }
  return params;
}

export class SessionStateConflictError extends Error {
  constructor(message = "Session state conflict") {
    super(message);
    this.name = "SessionStateConflictError";
  }
}

export function createSessionDao(db: Database) {
  function createSession(input: CreateSessionInput): SessionRow {
    const id = randomUUIDv7();
    db.query(
      `
        INSERT INTO sessions (
          id, version_id, variant,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          answers_json, current_step_id, is_result, history_json,
          session_started_event_id, session_started_recorded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, 0, ?, ?, 0)
      `,
    ).run(
      id,
      input.versionId,
      input.variant,
      input.utm.utmSource ?? null,
      input.utm.utmMedium ?? null,
      input.utm.utmCampaign ?? null,
      input.utm.utmTerm ?? null,
      input.utm.utmContent ?? null,
      input.currentStepId,
      JSON.stringify(input.history),
      input.sessionStartedEventId,
    );
    const row = getById(id);
    if (!row) {
      throw new Error(`Failed to create session: ${id}`);
    }
    return row;
  }

  function getById(id: string): SessionRow | null {
    return readRow(db, `SELECT * FROM sessions WHERE id = ?`, id, SessionRowSchema);
  }

  function updateState(
    sessionId: string,
    update: SessionStateUpdate,
    expected?: SessionStateExpectation,
  ): SessionRow {
    const query = expected
      ? `
        UPDATE sessions
        SET answers_json = ?, current_step_id = ?, is_result = ?, history_json = ?, updated_at = datetime('now')
        WHERE id = ?
          AND current_step_id IS ?
          AND is_result = ?
      `
      : `
        UPDATE sessions
        SET answers_json = ?, current_step_id = ?, is_result = ?, history_json = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
    const params = buildStateUpdateParams(sessionId, update, expected);
    const result = db.query(query).run(...params);
    if (result.changes === 0) {
      if (expected) {
        throw new SessionStateConflictError("Session state changed before update");
      }
      throw new Error(`Session not found: ${sessionId}`);
    }
    const row = getById(sessionId);
    if (!row) {
      throw new Error(`Session not found after update: ${sessionId}`);
    }
    return row;
  }

  function markSessionStartedRecorded(sessionId: string, eventId: string): boolean {
    const result = db
      .query(
        `
        UPDATE sessions
        SET session_started_recorded = 1, updated_at = datetime('now')
        WHERE id = ? AND session_started_event_id = ? AND session_started_recorded = 0
      `,
      )
      .run(sessionId, eventId);
    return result.changes > 0;
  }

  function getPendingSessionStartedEventId(sessionId: string): string | null {
    const row = getById(sessionId);
    if (!row || row.session_started_recorded === 1) {
      return null;
    }
    return row.session_started_event_id;
  }

  return {
    createSession,
    getById,
    updateState,
    markSessionStartedRecorded,
    getPendingSessionStartedEventId,
  };
}

export function createSessionTransitionDao(db: Database) {
  function insertTransition(input: InsertTransitionInput): void {
    db.query(
      `
        INSERT INTO session_transitions (
          transition_id, session_id, version_id, variant,
          from_step_id, to_step_id, to_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      input.transitionId,
      input.sessionId,
      input.versionId,
      input.variant,
      input.fromStepId,
      input.toStepId,
      input.toResult ? 1 : 0,
    );
  }

  function getTransition(transitionId: string): TransitionRow | null {
    const row = db
      .query(`SELECT * FROM session_transitions WHERE transition_id = ?`)
      .get(transitionId);
    const parsed = v.safeParse(v.pipe(v.unknown(), TransitionRowSchema), row);
    return parsed.success ? parsed.output : null;
  }

  function isTransitionLinkedToCompletion(transitionId: string): boolean {
    return rowExists(
      db,
      `SELECT 1 FROM events WHERE transition_id = ? AND event_name = 'step_completed' LIMIT 1`,
      transitionId,
    );
  }

  return { insertTransition, getTransition, isTransitionLinkedToCompletion };
}
