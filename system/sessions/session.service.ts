import { randomUUIDv7 } from "bun";
import type { Database } from "bun:sqlite";
import { createInitialState, restoreState } from "@/system/funnel/funnel-engine";
import type { FunnelAnswers, FunnelVariant } from "@/system/funnel/config.types";
import { FunnelAnswersSchema } from "@/system/funnel/config.schema";
import { parseJsonString } from "@/system/http/json";
import * as v from "valibot";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";
import {
  createSessionDao,
  createSessionTransitionDao,
  type SessionRow,
  type SessionStateExpectation,
  type SessionStateUpdate,
  type UtmParams,
} from "@/system/database/sessions/session.dao";
import { createVersionService } from "@/system/versions/version.service";

export type SessionSnapshot = {
  sessionId: string;
  versionId: string;
  variant: FunnelVariant;
  utm: UtmParams;
  answers: FunnelAnswers;
  currentStepId: string | null;
  isResult: boolean;
  history: string[];
  progress: { current: number; total: number; percent: number };
  pendingSessionStartedEventId: string | null;
};

type CreateSessionOptions = {
  variantOverride?: FunnelVariant;
  versionId?: string;
  utm?: UtmParams;
};

type RecordForwardTransitionInput = {
  sessionId: string;
  fromStepId: string;
  toStepId: string | null;
  toResult: boolean;
};

type ForwardTransitionInput = {
  fromStepId: string;
  toStepId: string | null;
  toResult: boolean;
};

export function createSessionService(db: Database) {
  const sessions = createSessionDao(db);
  const transitions = createSessionTransitionDao(db);
  const versions = createVersionService(db);

  function toSnapshot(row: SessionRow): SessionSnapshot {
    const config = versions.getConfigByVersionId(row.version_id);
    const effective = resolveEffectiveConfig(config, row.variant);
    const answers = parseJsonString(row.answers_json, FunnelAnswersSchema);
    const history = parseJsonString(row.history_json, v.array(v.string()));
    const state = restoreState(
      effective,
      answers,
      row.current_step_id,
      row.is_result === 1,
      history,
    );
    return {
      sessionId: row.id,
      versionId: row.version_id,
      variant: row.variant,
      utm: {
        utmSource: row.utm_source ?? undefined,
        utmMedium: row.utm_medium ?? undefined,
        utmCampaign: row.utm_campaign ?? undefined,
        utmTerm: row.utm_term ?? undefined,
        utmContent: row.utm_content ?? undefined,
      },
      answers,
      currentStepId: state.currentStepId,
      isResult: state.isResult,
      history,
      progress: state.progress,
      pendingSessionStartedEventId:
        row.session_started_recorded === 1 ? null : row.session_started_event_id,
    };
  }

  function createNew(options: CreateSessionOptions): SessionSnapshot {
    const versionId = options.versionId ?? versions.getActive()?.versionId;
    if (!versionId) {
      throw new Error("No funnel version available for session");
    }
    const config = versions.getConfigByVersionId(versionId);
    const variant = options.variantOverride ?? assignVariant();
    const effective = resolveEffectiveConfig(config, variant);
    const initial = createInitialState(effective);
    const eventId = randomUUIDv7();
    const currentStepId = initial.currentStepId;
    if (!currentStepId) {
      throw new Error("Initial funnel state has no current step");
    }
    const row = sessions.createSession({
      versionId,
      variant,
      utm: options.utm ?? {},
      sessionStartedEventId: eventId,
      currentStepId,
      history: initial.history,
    });
    return toSnapshot(row);
  }

  function createOrRestore(sessionId: string | null, options: CreateSessionOptions): SessionSnapshot {
    if (sessionId) {
      const existing = sessions.getById(sessionId);
      if (existing) {
        return toSnapshot(existing);
      }
    }
    return createNew(options);
  }

  function getSnapshot(sessionId: string): SessionSnapshot | null {
    const row = sessions.getById(sessionId);
    return row ? toSnapshot(row) : null;
  }

  function updateSessionState(
    sessionId: string,
    update: SessionStateUpdate,
    expected?: SessionStateExpectation,
  ): SessionSnapshot {
    const row = sessions.updateState(sessionId, update, expected);
    return toSnapshot(row);
  }

  function recordForwardTransition(input: RecordForwardTransitionInput): string {
    const row = sessions.getById(input.sessionId);
    if (!row) {
      throw new Error("Session not found");
    }
    const transitionId = randomUUIDv7();
    transitions.insertTransition({
      transitionId,
      sessionId: input.sessionId,
      versionId: row.version_id,
      variant: row.variant,
      fromStepId: input.fromStepId,
      toStepId: input.toStepId,
      toResult: input.toResult,
    });
    return transitionId;
  }

  function applyForwardTransition(
    sessionId: string,
    update: SessionStateUpdate,
    transition: ForwardTransitionInput,
    expected: SessionStateExpectation,
  ): { snapshot: SessionSnapshot; transitionId: string } {
    const run = db.transaction(() => {
      const snapshot = updateSessionState(sessionId, update, expected);
      const transitionId = recordForwardTransition({
        sessionId,
        fromStepId: transition.fromStepId,
        toStepId: transition.toStepId,
        toResult: transition.toResult,
      });
      return { snapshot, transitionId };
    });
    return run();
  }

  function getEffectiveConfigForSession(sessionId: string) {
    const row = sessions.getById(sessionId);
    if (!row) {
      throw new Error("Session not found");
    }
    const config = versions.getConfigByVersionId(row.version_id);
    return resolveEffectiveConfig(config, row.variant);
  }

  function markSessionStartedRecorded(sessionId: string, eventId: string): boolean {
    return sessions.markSessionStartedRecorded(sessionId, eventId);
  }

  return {
    createOrRestore,
    createNew,
    getSnapshot,
    updateSessionState,
    recordForwardTransition,
    applyForwardTransition,
    getEffectiveConfigForSession,
    markSessionStartedRecorded,
    getTransitionDao: () => transitions,
  };
}

function assignVariant(): FunnelVariant {
  return Math.random() < 0.5 ? "A" : "B";
}
