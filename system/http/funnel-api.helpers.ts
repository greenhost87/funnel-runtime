import type { NextResponse } from "next/server";
import type { Database } from "bun:sqlite";
import { getCookiePath } from "@/system/config/base-path";
import { isNodeEnvironment } from "@/system/config/environment";
import { advanceInfo, goBack, restoreState, submitAnswer } from "@/system/funnel/funnel-engine";
import type { AdvanceResult } from "@/system/funnel/funnel-engine";
import type {
  EffectiveFunnelConfig,
  FunnelSessionState,
  StepAnswer,
} from "@/system/funnel/config.types";
import { validateAnswer } from "@/system/funnel/answer-validation";
import type { FunnelApiState, MutationResponse } from "@/system/funnel/api-response.schema";
import { jsonResponse } from "@/system/http/json";
import { SessionStateConflictError } from "@/system/database/sessions/session.dao";
import { createSessionService, type SessionSnapshot } from "@/system/sessions/session.service";
import { createVersionService } from "@/system/versions/version.service";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "funnel_session_id";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isNodeEnvironment("production"),
    path: getCookiePath(),
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function getServices(db: Database) {
  return {
    db,
    sessions: createSessionService(db),
    versions: createVersionService(db),
  };
}

export async function getSessionIdFromCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions());
}

export function buildApiState(db: Database, snapshot: SessionSnapshot): FunnelApiState {
  const { sessions } = getServices(db);
  const config = sessions.getEffectiveConfigForSession(snapshot.sessionId);
  const state = restoreState(
    config,
    snapshot.answers,
    snapshot.currentStepId,
    snapshot.isResult,
    snapshot.history,
  );
  return {
    sessionId: snapshot.sessionId,
    versionId: snapshot.versionId,
    variant: snapshot.variant,
    config,
    state,
    result: snapshot.isResult ? config.result : null,
    pendingSessionStarted: snapshot.pendingSessionStartedEventId
      ? { eventId: snapshot.pendingSessionStartedEventId, eventName: "session_started" }
      : null,
  };
}

function buildMutationResponse(
  db: Database,
  snapshot: SessionSnapshot,
  transitionId?: string,
): MutationResponse {
  return {
    ...buildApiState(db, snapshot),
    transitionId,
  };
}

function jsonError(message: string, status = 400, details?: string[]) {
  return jsonResponse({ error: message, details }, { status });
}

function applyForwardResult(
  db: Database,
  sessionId: string,
  snapshot: { currentStepId: string | null; isResult: boolean },
  result: AdvanceResult,
) {
  const { sessions } = getServices(db);
  return sessions.applyForwardTransition(
    sessionId,
    {
      answers: result.state.answers,
      currentStepId: result.state.currentStepId,
      isResult: result.state.isResult,
      history: result.state.history,
    },
    {
      fromStepId: result.transition.fromStepId,
      toStepId: result.transition.toStepId,
      toResult: result.transition.toResult,
    },
    { currentStepId: snapshot.currentStepId, isResult: snapshot.isResult },
  );
}

function loadSessionContext(db: Database, sessionId: string) {
  const { sessions } = getServices(db);
  const snapshot = sessions.getSnapshot(sessionId);
  if (!snapshot) {
    return null;
  }
  const config = sessions.getEffectiveConfigForSession(sessionId);
  const currentState = restoreState(
    config,
    snapshot.answers,
    snapshot.currentStepId,
    snapshot.isResult,
    snapshot.history,
  );
  return { sessions, snapshot, config, currentState };
}

function missingSessionResponse(): Response {
  return jsonResponse({ error: "Session not found" }, { status: 404 });
}

function runForwardMutation(
  db: Database,
  sessionId: string,
  computeResult: (config: EffectiveFunnelConfig, state: FunnelSessionState) => AdvanceResult,
  invalidMessage: string,
): Response {
  const context = loadSessionContext(db, sessionId);
  if (!context) {
    return missingSessionResponse();
  }
  const { snapshot, config, currentState } = context;
  try {
    const result = computeResult(config, currentState);
    const { snapshot: updated, transitionId } = applyForwardResult(db, sessionId, snapshot, result);
    return jsonResponse(buildMutationResponse(db, updated, transitionId));
  } catch (error) {
    if (error instanceof SessionStateConflictError) {
      return jsonError(error.message, 409);
    }
    return jsonError(error instanceof Error ? error.message : invalidMessage, 400);
  }
}

export function parseUtmFromSearchParams(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    utmTerm: searchParams.get("utm_term") ?? undefined,
    utmContent: searchParams.get("utm_content") ?? undefined,
  };
}

export function parseVariantOverride(searchParams: URLSearchParams): "A" | "B" | undefined {
  const value = searchParams.get("variant");
  if (value === "A" || value === "B") {
    return value;
  }
  return undefined;
}

export function handleAnswerMutation(
  db: Database,
  sessionId: string,
  stepId: string,
  answer: StepAnswer | undefined,
) {
  const context = loadSessionContext(db, sessionId);
  if (!context) {
    return missingSessionResponse();
  }
  const currentStep = context.config.steps.find((step) => step.id === stepId);
  if (!currentStep) {
    return jsonResponse({ error: "Unknown step" }, { status: 400 });
  }
  const validation = validateAnswer(currentStep, answer);
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, { status: 400 });
  }
  return runForwardMutation(
    db,
    sessionId,
    (effectiveConfig, currentState) =>
      submitAnswer(effectiveConfig, currentState, stepId, validation.value),
    "Invalid answer mutation",
  );
}

export function handleAdvanceMutation(db: Database, sessionId: string): Response {
  return runForwardMutation(
    db,
    sessionId,
    (config, currentState) => advanceInfo(config, currentState),
    "Invalid advance mutation",
  );
}

export function handleBackMutation(db: Database, sessionId: string): Response {
  const context = loadSessionContext(db, sessionId);
  if (!context) {
    return missingSessionResponse();
  }
  const nextState = goBack(context.config, context.currentState);
  const updated = context.sessions.updateSessionState(sessionId, {
    answers: nextState.answers,
    currentStepId: nextState.currentStepId,
    isResult: nextState.isResult,
    history: nextState.history,
  });
  return jsonResponse(buildMutationResponse(db, updated));
}

export async function runSessionMutation(
  db: Database,
  handler: (db: Database, sessionId: string) => Response,
): Promise<Response> {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return jsonResponse({ error: "No session" }, { status: 401 });
  }
  return handler(db, sessionId);
}
