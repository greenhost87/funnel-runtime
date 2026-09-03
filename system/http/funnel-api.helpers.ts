import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabase } from "@/system/database/connection";
import { advanceInfo, goBack, restoreState, submitAnswer } from "@/system/funnel/funnel-engine";
import { validateAnswer } from "@/system/funnel/answer-validation";
import type { FunnelApiState, MutationResponse } from "@/system/funnel/funnel-response.types";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";
import { SessionService } from "@/system/sessions/session.service";
import { VersionService } from "@/system/versions/version.service";

export const SESSION_COOKIE_NAME = "funnel_session_id";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export function getServices() {
  const db = getDatabase();
  return {
    db,
    sessions: new SessionService(db),
    versions: new VersionService(db),
  };
}

export async function getSessionIdFromCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);
}

export function buildApiState(
  snapshot: ReturnType<SessionService["getSnapshot"]> extends infer T ? NonNullable<T> : never,
): FunnelApiState {
  const { sessions, versions } = getServices();
  void versions;
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

export function buildMutationResponse(
  snapshot: NonNullable<ReturnType<SessionService["getSnapshot"]>>,
  transitionId?: string,
): MutationResponse {
  return {
    ...buildApiState(snapshot),
    transitionId,
  };
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

export function handleAnswerMutation(sessionId: string, stepId: string, answer: unknown) {
  const { sessions } = getServices();
  const snapshot = sessions.getSnapshot(sessionId);
  if (!snapshot) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const config = sessions.getEffectiveConfigForSession(sessionId);
  const currentStep = config.steps.find((step) => step.id === stepId);
  if (!currentStep) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }
  const validation = validateAnswer(currentStep, answer);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const currentState = restoreState(
    config,
    snapshot.answers,
    snapshot.currentStepId,
    snapshot.isResult,
    snapshot.history,
  );
  const result = submitAnswer(config, currentState, stepId, validation.value);
  const transitionId = sessions.recordForwardTransition({
    sessionId,
    fromStepId: result.transition.fromStepId,
    toStepId: result.transition.toStepId,
    toResult: result.transition.toResult,
  });
  const updated = sessions.updateSessionState(sessionId, {
    answers: result.state.answers,
    currentStepId: result.state.currentStepId,
    isResult: result.state.isResult,
    history: result.state.history,
  });
  return NextResponse.json(buildMutationResponse(updated, transitionId));
}

export function handleAdvanceMutation(sessionId: string) {
  const { sessions } = getServices();
  const snapshot = sessions.getSnapshot(sessionId);
  if (!snapshot) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const config = sessions.getEffectiveConfigForSession(sessionId);
  const currentState = restoreState(
    config,
    snapshot.answers,
    snapshot.currentStepId,
    snapshot.isResult,
    snapshot.history,
  );
  const result = advanceInfo(config, currentState);
  const transitionId = sessions.recordForwardTransition({
    sessionId,
    fromStepId: result.transition.fromStepId,
    toStepId: result.transition.toStepId,
    toResult: result.transition.toResult,
  });
  const updated = sessions.updateSessionState(sessionId, {
    answers: result.state.answers,
    currentStepId: result.state.currentStepId,
    isResult: result.state.isResult,
    history: result.state.history,
  });
  return NextResponse.json(buildMutationResponse(updated, transitionId));
}

export function handleBackMutation(sessionId: string) {
  const { sessions } = getServices();
  const snapshot = sessions.getSnapshot(sessionId);
  if (!snapshot) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const config = sessions.getEffectiveConfigForSession(sessionId);
  const currentState = restoreState(
    config,
    snapshot.answers,
    snapshot.currentStepId,
    snapshot.isResult,
    snapshot.history,
  );
  const nextState = goBack(config, currentState);
  const updated = sessions.updateSessionState(sessionId, {
    answers: nextState.answers,
    currentStepId: nextState.currentStepId,
    isResult: nextState.isResult,
    history: nextState.history,
  });
  return NextResponse.json(buildMutationResponse(updated));
}

export function jsonError(message: string, status = 400, details?: string[]) {
  return NextResponse.json({ error: message, details }, { status });
}
