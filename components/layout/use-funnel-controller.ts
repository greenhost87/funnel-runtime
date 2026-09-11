"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceFunnelStepAction,
  goBackFunnelAction,
  loadFunnelSessionAction,
  submitFunnelAnswerAction,
} from "@/app/actions/funnel";
import type { FunnelApiState, MutationResponse } from "@/system/funnel/api-response.schema";
import type { FunnelStep, StepAnswer } from "@/system/funnel/config.types";
import type { ActionResult } from "@/system/http/action-result";
import {
  createEventId,
  createEventIntent,
  retryPendingEvents,
  sendEventBatch,
  sendEventWithRetry,
} from "@/components/layout/event-client";

type ControllerState = {
  data: FunnelApiState | null;
  loading: boolean;
  error: string | null;
  validationError: string | null;
  draftAnswer: StepAnswer | null;
};

function answerForCurrentStep(data: FunnelApiState): StepAnswer | null {
  const stepId = data.state.currentStepId;
  return stepId ? (data.state.answers[stepId] ?? null) : null;
}

export function useFunnelController(initialQuery = "") {
  const [state, setState] = useState<ControllerState>({
    data: null,
    loading: true,
    error: null,
    validationError: null,
    draftAnswer: null,
  });
  const sessionStartedSent = useRef(false);
  const loadStarted = useRef(false);

  const emitStepViewed = useCallback(async (data: FunnelApiState, stepId: string) => {
    await sendEventWithRetry(
      createEventIntent({
        eventId: createEventId(),
        eventName: "step_viewed",
        sessionId: data.sessionId,
        stepId,
      }),
    );
  }, []);

  const emitResultViewed = useCallback(async (data: FunnelApiState) => {
    await sendEventWithRetry(
      createEventIntent({
        eventId: createEventId(),
        eventName: "result_viewed",
        sessionId: data.sessionId,
      }),
    );
  }, []);

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
    const result = await loadFunnelSessionAction(initialQuery);
    if (!result.ok) {
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load session" }));
      return;
    }
    const data = result.data;
    setState((prev) => ({
      ...prev,
      data,
      loading: false,
      draftAnswer: answerForCurrentStep(data),
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

  function applyMutation(result: ActionResult<MutationResponse>): MutationResponse | null {
    if (!result.ok) {
      setState((prev) => ({ ...prev, validationError: result.error }));
      return null;
    }
    setState((prev) => ({
      ...prev,
      data: result.data,
      validationError: null,
      draftAnswer: answerForCurrentStep(result.data),
    }));
    return result.data;
  }

  async function submitCurrentAnswer() {
    const current = state.data;
    if (!current?.state.currentStepId) {
      return;
    }
    const stepId = current.state.currentStepId;
    const payload = applyMutation(await submitFunnelAnswerAction(stepId, state.draftAnswer));
    if (!payload) {
      return;
    }

    await sendEventBatch([
      createEventIntent({
        eventId: createEventId(),
        eventName: "answer_submitted",
        sessionId: current.sessionId,
        stepId,
      }),
      createEventIntent({
        eventId: createEventId(),
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
    const payload = applyMutation(await advanceFunnelStepAction());
    if (!payload?.transitionId || !stepId) {
      return;
    }

    await sendEventWithRetry(
      createEventIntent({
        eventId: createEventId(),
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
    const payload = applyMutation(await goBackFunnelAction());
    if (!payload) {
      return;
    }
    await sendEventWithRetry(
      createEventIntent({
        eventId: createEventId(),
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
        eventId: createEventId(),
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
