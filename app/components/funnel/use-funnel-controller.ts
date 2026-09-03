"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FunnelApiState, MutationResponse } from "@/system/funnel/funnel-response.types";
import type { FunnelStep } from "@/system/funnel/config.types";
import {
  createEventId,
  createEventIntent,
  sendEventBatch,
  sendEventWithRetry,
} from "@/app/components/funnel/event-client";

type ControllerState = {
  data: FunnelApiState | null;
  loading: boolean;
  error: string | null;
  validationError: string | null;
  draftAnswer: unknown;
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
    if (!eventIds.current[key]) {
      eventIds.current[key] = createEventId();
    }
    return eventIds.current[key];
  }, []);

  const bootstrapEvents = useCallback(
    async (data: FunnelApiState) => {
      if (data.pendingSessionStarted && !sessionStartedSent.current) {
        sessionStartedSent.current = true;
        await sendEventWithRetry(
          createEventIntent({
            eventId: data.pendingSessionStarted.eventId,
            eventName: "session_started",
            sessionId: data.sessionId,
          }),
        );
      }

      if (data.state.currentStepId && !data.state.isResult) {
        const viewKey = `${data.sessionId}:${data.state.currentStepId}`;
        if (!viewedSteps.current.has(viewKey)) {
          viewedSteps.current.add(viewKey);
          await sendEventWithRetry(
            createEventIntent({
              eventId: stableEventId(`step_viewed:${viewKey}`),
              eventName: "step_viewed",
              sessionId: data.sessionId,
              stepId: data.state.currentStepId,
            }),
          );
        }
      }

      if (data.state.isResult) {
        await sendEventWithRetry(
          createEventIntent({
            eventId: stableEventId(`result_viewed:${data.sessionId}`),
            eventName: "result_viewed",
            sessionId: data.sessionId,
          }),
        );
      }
    },
    [stableEventId],
  );

  const loadSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const response = await fetch(`/api/funnel/session${initialQuery}`, { method: "GET" });
    if (!response.ok) {
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load session" }));
      return;
    }
    const data = (await response.json()) as FunnelApiState;
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

  async function emitStepViewed(data: FunnelApiState, stepId: string) {
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
  }

  async function emitResultViewed(data: FunnelApiState) {
    const key = `result_viewed:${data.sessionId}`;
    await sendEventWithRetry(
      createEventIntent({
        eventId: stableEventId(key),
        eventName: "result_viewed",
        sessionId: data.sessionId,
      }),
    );
  }

  async function applyMutation(response: Response): Promise<MutationResponse | null> {
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setState((prev) => ({ ...prev, validationError: payload.error ?? "Request failed" }));
      return null;
    }
    const payload = (await response.json()) as MutationResponse;
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
    const response = await fetch("/api/funnel/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, answer: state.draftAnswer }),
    });
    const payload = await applyMutation(response);
    if (!payload) {
      return;
    }

    await sendEventBatch([
      createEventIntent({
        eventId: stableEventId(`answer_submitted:${current.sessionId}:${stepId}`),
        eventName: "answer_submitted",
        sessionId: current.sessionId,
        stepId,
      }),
      createEventIntent({
        eventId: stableEventId(`step_completed:${payload.transitionId}`),
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
    const response = await fetch("/api/funnel/advance", { method: "POST" });
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
    const response = await fetch("/api/funnel/back", { method: "POST" });
    const payload = await applyMutation(response);
    if (!payload) {
      return;
    }
    await sendEventWithRetry(
      createEventIntent({
        eventId: stableEventId(`back_clicked:${current.sessionId}:${Date.now()}`),
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

  function setDraftAnswer(value: unknown) {
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
