import { randomUUIDv7 } from "bun";
import type { Database } from "bun:sqlite";
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

export class SessionDao {
  constructor(private readonly db: Database) {}

  createSession(input: {
    versionId: string;
    variant: FunnelVariant;
    utm: UtmParams;
    sessionStartedEventId: string;
    currentStepId: string;
    history: string[];
  }): SessionRow {
    const id = randomUUIDv7();
    this.db
      .query(
        `
        INSERT INTO sessions (
          id, version_id, variant,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          answers_json, current_step_id, is_result, history_json,
          session_started_event_id, session_started_recorded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, 0, ?, ?, 0)
      `,
      )
      .run(
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
    return this.getById(id)!;
  }

  getById(id: string): SessionRow | null {
    return (
      (this.db.query(`SELECT * FROM sessions WHERE id = ?`).get(id) as SessionRow | null) ?? null
    );
  }

  updateState(sessionId: string, update: SessionStateUpdate): SessionRow {
    const result = this.db
      .query(
        `
        UPDATE sessions
        SET answers_json = ?, current_step_id = ?, is_result = ?, history_json = ?, updated_at = datetime('now')
        WHERE id = ?
      `,
      )
      .run(
        JSON.stringify(update.answers),
        update.currentStepId,
        update.isResult ? 1 : 0,
        JSON.stringify(update.history),
        sessionId,
      );
    if (result.changes === 0) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return this.getById(sessionId)!;
  }

  markSessionStartedRecorded(sessionId: string, eventId: string): boolean {
    const result = this.db
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

  getPendingSessionStartedEventId(sessionId: string): string | null {
    const row = this.getById(sessionId);
    if (!row || row.session_started_recorded === 1) {
      return null;
    }
    return row.session_started_event_id;
  }
}

export class SessionTransitionDao {
  constructor(private readonly db: Database) {}

  insertTransition(input: {
    transitionId: string;
    sessionId: string;
    versionId: string;
    variant: FunnelVariant;
    fromStepId: string;
    toStepId: string | null;
    toResult: boolean;
  }): void {
    this.db
      .query(
        `
        INSERT INTO session_transitions (
          transition_id, session_id, version_id, variant,
          from_step_id, to_step_id, to_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        input.transitionId,
        input.sessionId,
        input.versionId,
        input.variant,
        input.fromStepId,
        input.toStepId,
        input.toResult ? 1 : 0,
      );
  }

  getTransition(transitionId: string): {
    transition_id: string;
    session_id: string;
    version_id: string;
    variant: FunnelVariant;
    from_step_id: string;
    to_step_id: string | null;
    to_result: number;
  } | null {
    return (
      (this.db
        .query(`SELECT * FROM session_transitions WHERE transition_id = ?`)
        .get(transitionId) as {
        transition_id: string;
        session_id: string;
        version_id: string;
        variant: FunnelVariant;
        from_step_id: string;
        to_step_id: string | null;
        to_result: number;
      } | null) ?? null
    );
  }

  isTransitionLinkedToCompletion(transitionId: string): boolean {
    const row = this.db
      .query(
        `SELECT 1 FROM events WHERE transition_id = ? AND event_name = 'step_completed' LIMIT 1`,
      )
      .get(transitionId);
    return row !== null;
  }
}
