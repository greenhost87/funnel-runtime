"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ErrorResponseSchema,
  FunnelApiStateSchema,
  MutationResponseSchema,
} from "@/system/funnel/api-response.schema";
import type { FunnelApiState, MutationResponse } from "@/system/funnel/api-response.schema";
import type { FunnelStep, StepAnswer } from "@/system/funnel/config.types";
import { parseJsonFromReadable } from "@/system/http/json";
import {
  createEventId,
  createEventIntent,
  retryPendingEvents,
  sendEventBatch,
  sendEventWithRetry,
} from "@/app/components/funnel/event-client";
import { withBasePath } from "@/system/config/base-path";

type ControllerState = {
  data: FunnelApiState | null;
  loading: boolean;
  error: string | null;
  validationError: string | null;
  draftAnswer: StepAnswer | null;
};

export function useFunnelController(initialQuery = "") {
  const [state, setState] = useState<ControllerState>({
    data: null,
    loading: true,
    error: null,
    validationError: null,
    draftAnswer: null,
  });
  const viewedSteps = useRef(new Set<string>());
  const sessionStartedSent = useRef(false);
  const eventIds = useRef<Record<string, string>>({});
  const loadStarted = useRef(false);

  const stableEventId = useCallback((key: string) => {
    eventIds.current[key] ??= createEventId();
    return eventIds.current[key];
  }, []);

  const emitStepViewed = useCallback(
    async (data: FunnelApiState, stepId: string) => {
      const viewKey = `${data.sessionId}:${stepId}`;
      if (viewedSteps.current.has(viewKey)) {
        return;
      }
      viewedSteps.current.add(viewKey);
      await sendEventWithRetry(
        createEventIntent({
          eventId: stableEventId(`step_viewed:${viewKey}`),
          eventName: "step_viewed",
          sessionId: data.sessionId,
          stepId,
        }),
      );
    },
    [stableEventId],
  );

  const emitResultViewed = useCallback(
    async (data: FunnelApiState) => {
      const key = `result_viewed:${data.sessionId}`;
      await sendEventWithRetry(
        createEventIntent({
          eventId: stableEventId(key),
          eventName: "result_viewed",
          sessionId: data.sessionId,
        }),
      );
    },
    [stableEventId],
  );

  const bootstrapEvents = useCallback(
    async (data: FunnelApiState) => {
      await retryPendingEvents(data.sessionId);

      if (data.pendingSessionStarted && !sessionStartedSent.current) {
        const result = await sendEventWithRetry(
          createEventIntent({
            eventId: data.pendingSessionStarted.eventId,
            eventName: "session_started",
            sessionId: data.sessionId,
          }),
        );
        if (result.status === "accepted" || result.status === "duplicate") {
          sessionStartedSent.current = true;
        }
      }

      if (data.state.currentStepId && !data.state.isResult) {
        await emitStepViewed(data, data.state.currentStepId);
      }

      if (data.state.isResult) {
        await emitResultViewed(data);
      }
    },
    [emitResultViewed, emitStepViewed],
  );

  const loadSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const response = await fetch(withBasePath(`/api/funnel/session${initialQuery}`), {
      method: "GET",
    });
    if (!response.ok) {
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load session" }));
      return;
    }
    const data = await parseJsonFromReadable(response, FunnelApiStateSchema);
    setState((prev) => ({
      ...prev,
      data,
      loading: false,
      draftAnswer: null,
      validationError: null,
    }));
    await bootstrapEvents(data);
  }, [bootstrapEvents, initialQuery]);

  useEffect(() => {
    if (loadStarted.current) {
      return;
    }
    loadStarted.current = true;
    void loadSession();
  }, [loadSession]);

  async function applyMutation(response: Response): Promise<MutationResponse | null> {
    if (!response.ok) {
      const payload = await parseJsonFromReadable(response, ErrorResponseSchema);
      setState((prev) => ({ ...prev, validationError: payload.error }));
      return null;
    }
    const payload = await parseJsonFromReadable(response, MutationResponseSchema);
    setState((prev) => ({
      ...prev,
      data: payload,
      validationError: null,
      draftAnswer: null,
    }));
    return payload;
  }

  async function submitCurrentAnswer() {
    const current = state.data;
    if (!current?.state.currentStepId) {
      return;
    }
    const stepId = current.state.currentStepId;
    const response = await fetch(withBasePath("/api/funnel/answer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, answer: state.draftAnswer }),
    });
    const payload = await applyMutation(response);
    if (!payload) {
      return;
    }

    const transitionKey = payload.transitionId ?? "missing";
    await sendEventBatch([
      createEventIntent({
        eventId: stableEventId(`answer_submitted:${current.sessionId}:${stepId}`),
        eventName: "answer_submitted",
        sessionId: current.sessionId,
        stepId,
      }),
      createEventIntent({
        eventId: stableEventId(`step_completed:${transitionKey}`),
        eventName: "step_completed",
        sessionId: current.sessionId,
        stepId,
        transitionId: payload.transitionId,
      }),
    ]);

    if (payload.state.isResult) {
      await emitResultViewed(payload);
    } else if (payload.state.currentStepId) {
      await emitStepViewed(payload, payload.state.currentStepId);
    }
  }

  async function advanceInfoStep() {
    const current = state.data;
    if (!current) {
      return;
    }
    const stepId = current.state.currentStepId;
    const response = await fetch(withBasePath("/api/funnel/advance"), { method: "POST" });
    const payload = await applyMutation(response);
    if (!payload?.transitionId || !stepId) {
      return;
    }

    await sendEventWithRetry(
      createEventIntent({
        eventId: stableEventId(`step_completed:${payload.transitionId}`),
        eventName: "step_completed",
        sessionId: current.sessionId,
        stepId,
        transitionId: payload.transitionId,
      }),
    );

    if (payload.state.isResult) {
      await emitResultViewed(payload);
    } else if (payload.state.currentStepId) {
      await emitStepViewed(payload, payload.state.currentStepId);
    }
  }

  async function goBack() {
    const current = state.data;
    if (!current) {
      return;
    }
    const response = await fetch(withBasePath("/api/funnel/back"), { method: "POST" });
    const payload = await applyMutation(response);
    if (!payload) {
      return;
    }
    await sendEventWithRetry(
      createEventIntent({
        eventId: stableEventId(
          `back_clicked:${current.sessionId}:${current.state.history.join(">")}`,
        ),
        eventName: "back_clicked",
        sessionId: current.sessionId,
        stepId: current.state.currentStepId ?? undefined,
      }),
    );
    if (payload.state.currentStepId) {
      await emitStepViewed(payload, payload.state.currentStepId);
    }
  }

  async function clickCta() {
    const current = state.data;
    if (!current) {
      return;
    }
    await sendEventWithRetry(
      createEventIntent({
        eventId: stableEventId(`cta_clicked:${current.sessionId}`),
        eventName: "cta_clicked",
        sessionId: current.sessionId,
      }),
    );
    if (current.result?.cta.url) {
      window.open(current.result.cta.url, "_blank", "noopener,noreferrer");
    }
  }

  function setDraftAnswer(value: StepAnswer | null) {
    setState((prev) => ({ ...prev, draftAnswer: value, validationError: null }));
  }

  function getCurrentStep(): FunnelStep | null {
    if (!state.data || state.data.state.isResult) {
      return null;
    }
    return (
      state.data.config.steps.find((step) => step.id === state.data?.state.currentStepId) ?? null
    );
  }

  return {
    ...state,
    currentStep: getCurrentStep(),
    setDraftAnswer,
    submitCurrentAnswer,
    advanceInfoStep,
    goBack,
    clickCta,
    reload: loadSession,
  };
}
