import type { Database } from "bun:sqlite";
import * as v from "valibot";
import { BatchEventItemSchema, validateBatchItem } from "@/system/events/event.schema";
import type { BatchEventInput, BatchEventResult } from "@/system/events/event.types";
import { sanitizeEventProperties } from "@/system/events/event-properties.schema";
import { createEventDao } from "@/system/database/events/event.dao";
import {
  createSessionDao,
  createSessionTransitionDao,
  type SessionRow,
} from "@/system/database/sessions/session.dao";
import { createVersionService } from "@/system/versions/version.service";
import type { JsonValue } from "@/system/http/json";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";
import type { EffectiveFunnelConfig } from "@/system/funnel/config.types";

const BUILT_IN_EVENTS = [
  "session_started",
  "step_viewed",
  "answer_submitted",
  "step_completed",
  "back_clicked",
  "result_viewed",
  "cta_clicked",
];

const BUILT_IN_EVENT_SET = new Set<string>(BUILT_IN_EVENTS);

function reject(eventId: string, reason: string): BatchEventResult {
  return { eventId, status: "rejected", reason };
}

const EventIdOnlySchema = v.object({ eventId: v.string() });

type BatchEventCandidate = BatchEventInput | JsonValue;

function readEventId(item: BatchEventCandidate, index: number): string {
  const parsed = v.safeParse(EventIdOnlySchema, item);
  return parsed.success ? parsed.output.eventId : `invalid:${index}`;
}

export function createEventService(db: Database) {
  const events = createEventDao(db);
  const sessions = createSessionDao(db);
  const transitions = createSessionTransitionDao(db);
  const versions = createVersionService(db);

  function processBatch(
    items: BatchEventCandidate[],
    expectedSessionId?: string,
  ): BatchEventResult[] {
    return items.map((item, index) => {
      const parsed = v.safeParse(BatchEventItemSchema, item);
      if (!parsed.success) {
        return reject(readEventId(item, index), "Invalid event payload");
      }
      return processOne(parsed.output, expectedSessionId);
    });
  }

  function validateEventName(
    item: BatchEventInput,
    customEvents: Set<string>,
    versionId: string,
  ): string | null {
    if (!BUILT_IN_EVENT_SET.has(item.eventName) && !customEvents.has(item.eventName)) {
      return `Event not declared in pinned version ${versionId}`;
    }
    return null;
  }

  function validateStepCompleted(
    item: BatchEventInput,
  ): { ok: true; transitionId: string } | { ok: false; reason: string } {
    const transitionIdValue = item.transitionId;
    if (!transitionIdValue) {
      return { ok: false, reason: "Missing transitionId" };
    }
    const transition = transitions.getTransition(transitionIdValue);
    if (!transition) {
      return { ok: false, reason: "Unknown transition" };
    }
    if (transition.session_id !== item.sessionId) {
      return { ok: false, reason: "Transition belongs to another session" };
    }
    if (item.stepId && transition.from_step_id !== item.stepId) {
      return { ok: false, reason: "Transition step mismatch" };
    }
    if (transitions.isTransitionLinkedToCompletion(transitionIdValue)) {
      return { ok: false, reason: "Transition already completed" };
    }
    return { ok: true, transitionId: transitionIdValue };
  }

  function validateSessionStarted(item: BatchEventInput, session: SessionRow): string | null {
    if (session.session_started_event_id !== item.eventId) {
      return "session_started event id mismatch";
    }
    return null;
  }

  function validateReachedStep(
    item: BatchEventInput,
    config: EffectiveFunnelConfig,
  ): string | null {
    const stepId = item.stepId;
    if (!stepId || !config.steps.some((step) => step.id === stepId)) {
      return "Step is not part of the pinned funnel variant";
    }
    const isInitialStep = config.steps[0]?.id === stepId;
    if (!isInitialStep && !transitions.hasTransitionToStep(item.sessionId, stepId)) {
      return "Session has not reached this step";
    }
    return null;
  }

  function validateEventState(item: BatchEventInput, config: EffectiveFunnelConfig): string | null {
    if (item.eventName === "step_viewed" || item.eventName === "back_clicked") {
      return validateReachedStep(item, config);
    }
    if (item.eventName === "answer_submitted") {
      const reachedError = validateReachedStep(item, config);
      if (reachedError) {
        return reachedError;
      }
      return item.stepId && transitions.hasTransitionFromStep(item.sessionId, item.stepId)
        ? null
        : "No server transition exists for this answer";
    }
    if (
      (item.eventName === "result_viewed" || item.eventName === "cta_clicked") &&
      !transitions.hasTransitionToResult(item.sessionId)
    ) {
      return "Session has not reached the result";
    }
    return null;
  }

  function validateInput(item: BatchEventInput, expectedSessionId?: string): string | null {
    const validationError = validateBatchItem(item);
    if (validationError) {
      return validationError;
    }
    if (expectedSessionId && item.sessionId !== expectedSessionId) {
      return "Event session does not match the authenticated session";
    }
    return null;
  }

  function validateEventAgainstSession(item: BatchEventInput, session: SessionRow): string | null {
    const config = versions.getConfigByVersionId(session.version_id);
    const eventNameError = validateEventName(
      item,
      new Set(config.customEvents ?? []),
      session.version_id,
    );
    if (eventNameError) {
      return eventNameError;
    }
    const effectiveConfig = resolveEffectiveConfig(config, session.variant);
    const stateError = validateEventState(item, effectiveConfig);
    if (stateError) {
      return stateError;
    }
    return item.eventName === "session_started" ? validateSessionStarted(item, session) : null;
  }

  function transitionIdForEvent(item: BatchEventInput): {
    value: string | null;
    error: string | null;
  } {
    if (item.eventName !== "step_completed") {
      return { value: null, error: null };
    }
    const completed = validateStepCompleted(item);
    return completed.ok
      ? { value: completed.transitionId, error: null }
      : { value: null, error: completed.reason };
  }

  function persistEvent(
    item: BatchEventInput,
    session: SessionRow,
    transitionId: string | null,
  ): "inserted" | "duplicate" {
    const run = db.transaction(() => {
      const result = events.insertEvent({
        eventId: item.eventId,
        sessionId: item.sessionId,
        eventName: item.eventName,
        clientTimestamp: item.clientTimestamp,
        versionId: session.version_id,
        variant: session.variant,
        stepId: item.stepId,
        utmSource: session.utm_source ?? undefined,
        utmMedium: session.utm_medium ?? undefined,
        utmCampaign: session.utm_campaign ?? undefined,
        utmTerm: session.utm_term ?? undefined,
        utmContent: session.utm_content ?? undefined,
        transitionId: transitionId ?? undefined,
        properties: sanitizeEventProperties(item.properties),
      });

      if (item.eventName === "session_started") {
        sessions.markSessionStartedRecorded(item.sessionId, item.eventId);
      }

      return result === "duplicate" ? ("duplicate" as const) : ("inserted" as const);
    });
    return run();
  }

  function persistEventResult(
    item: BatchEventInput,
    session: SessionRow,
    transitionId: string | null,
  ): BatchEventResult {
    try {
      const insertResult = persistEvent(item, session, transitionId);
      return insertResult === "duplicate"
        ? { eventId: item.eventId, status: "duplicate" }
        : { eventId: item.eventId, status: "accepted" };
    } catch {
      return reject(item.eventId, "Failed to persist event");
    }
  }

  function processOne(item: BatchEventInput, expectedSessionId?: string): BatchEventResult {
    const inputError = validateInput(item, expectedSessionId);
    if (inputError) {
      return reject(item.eventId, inputError);
    }
    if (events.eventExists(item.eventId)) {
      return { eventId: item.eventId, status: "duplicate" };
    }
    const session = sessions.getById(item.sessionId);
    if (!session) {
      return reject(item.eventId, "Unknown session");
    }
    const sessionError = validateEventAgainstSession(item, session);
    if (sessionError) {
      return reject(item.eventId, sessionError);
    }
    const transition = transitionIdForEvent(item);
    if (transition.error) {
      return reject(item.eventId, transition.error);
    }
    return persistEventResult(item, session, transition.value);
  }

  return { processBatch };
}
