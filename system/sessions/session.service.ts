import { randomUUIDv7 } from "bun";
import type { Database } from "bun:sqlite";
import { createInitialState, restoreState } from "@/system/funnel/funnel-engine";
import type { FunnelAnswers, FunnelVariant } from "@/system/funnel/config.types";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";
import {
  SessionDao,
  SessionTransitionDao,
  type UtmParams,
} from "@/system/database/sessions/session.dao";
import { VersionService } from "@/system/versions/version.service";

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

export class SessionService {
  private readonly sessions: SessionDao;
  private readonly transitions: SessionTransitionDao;
  private readonly versions: VersionService;

  constructor(db: Database) {
    this.sessions = new SessionDao(db);
    this.transitions = new SessionTransitionDao(db);
    this.versions = new VersionService(db);
  }

  createOrRestore(
    sessionId: string | null,
    options: { variantOverride?: FunnelVariant; utm?: UtmParams },
  ): SessionSnapshot {
    if (sessionId) {
      const existing = this.sessions.getById(sessionId);
      if (existing) {
        return this.toSnapshot(existing);
      }
    }
    return this.createNew(options);
  }

  createNew(options: { variantOverride?: FunnelVariant; utm?: UtmParams }): SessionSnapshot {
    const active = this.versions.getActive();
    if (!active) {
      throw new Error("No active funnel version");
    }
    const variant = options.variantOverride ?? this.assignVariant();
    const effective = resolveEffectiveConfig(active.config, variant);
    const initial = createInitialState(effective);
    const eventId = randomUUIDv7();
    const row = this.sessions.createSession({
      versionId: active.versionId,
      variant,
      utm: options.utm ?? {},
      sessionStartedEventId: eventId,
      currentStepId: initial.currentStepId!,
      history: initial.history,
    });
    return this.toSnapshot(row);
  }

  getSnapshot(sessionId: string): SessionSnapshot | null {
    const row = this.sessions.getById(sessionId);
    return row ? this.toSnapshot(row) : null;
  }

  updateSessionState(
    sessionId: string,
    update: {
      answers: FunnelAnswers;
      currentStepId: string | null;
      isResult: boolean;
      history: string[];
    },
  ): SessionSnapshot {
    const row = this.sessions.updateState(sessionId, update);
    return this.toSnapshot(row);
  }

  recordForwardTransition(input: {
    sessionId: string;
    fromStepId: string;
    toStepId: string | null;
    toResult: boolean;
  }): string {
    const row = this.sessions.getById(input.sessionId);
    if (!row) {
      throw new Error("Session not found");
    }
    const transitionId = randomUUIDv7();
    this.transitions.insertTransition({
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

  getEffectiveConfigForSession(sessionId: string) {
    const row = this.sessions.getById(sessionId);
    if (!row) {
      throw new Error("Session not found");
    }
    const config = this.versions.getConfigByVersionId(row.version_id);
    return resolveEffectiveConfig(config, row.variant);
  }

  markSessionStartedRecorded(sessionId: string, eventId: string): boolean {
    return this.sessions.markSessionStartedRecorded(sessionId, eventId);
  }

  getTransitionDao(): SessionTransitionDao {
    return this.transitions;
  }

  private assignVariant(): FunnelVariant {
    return Math.random() < 0.5 ? "A" : "B";
  }

  private toSnapshot(row: {
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
  }): SessionSnapshot {
    const config = this.versions.getConfigByVersionId(row.version_id);
    const effective = resolveEffectiveConfig(config, row.variant);
    const answers = JSON.parse(row.answers_json) as FunnelAnswers;
    const history = JSON.parse(row.history_json) as string[];
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
}
