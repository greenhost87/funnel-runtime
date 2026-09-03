import type { Database } from "bun:sqlite";
import { validateBatchItem } from "@/system/events/event.schema";
import type { BatchEventInput, BatchEventResult } from "@/system/events/event.types";
import { sanitizeEventProperties } from "@/system/events/event-properties.schema";
import { createEventDao } from "@/system/database/events/event.dao";
import {
  createSessionDao,
  createSessionTransitionDao,
  type SessionRow,
} from "@/system/database/sessions/session.dao";
import { createVersionService } from "@/system/versions/version.service";

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

export function createEventService(db: Database) {
  const events = createEventDao(db);
  const sessions = createSessionDao(db);
  const transitions = createSessionTransitionDao(db);
  const versions = createVersionService(db);

  function processBatch(items: BatchEventInput[]): BatchEventResult[] {
    return items.map((item) => processOne(item));
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
        stepId: item.stepId ?? null,
        utmSource: session.utm_source,
        utmMedium: session.utm_medium,
        utmCampaign: session.utm_campaign,
        utmTerm: session.utm_term,
        utmContent: session.utm_content,
        transitionId,
        properties: sanitizeEventProperties(item.properties),
      });

      if (item.eventName === "session_started") {
        sessions.markSessionStartedRecorded(item.sessionId, item.eventId);
      }

      return result === "duplicate" ? ("duplicate" as const) : ("inserted" as const);
    });
    return run();
  }

  function processOne(item: BatchEventInput): BatchEventResult {
    const validationError = validateBatchItem(item);
    if (validationError) {
      return reject(item.eventId, validationError);
    }

    const session = sessions.getById(item.sessionId);
    if (!session) {
      return reject(item.eventId, "Unknown session");
    }

    const config = versions.getConfigByVersionId(session.version_id);
    const eventNameError = validateEventName(
      item,
      new Set(config.customEvents ?? []),
      session.version_id,
    );
    if (eventNameError) {
      return reject(item.eventId, eventNameError);
    }

    let transitionId: string | null = null;
    if (item.eventName === "step_completed") {
      const stepCompleted = validateStepCompleted(item);
      if (!stepCompleted.ok) {
        return reject(item.eventId, stepCompleted.reason);
      }
      transitionId = stepCompleted.transitionId;
    }

    if (item.eventName === "session_started") {
      const sessionStartedError = validateSessionStarted(item, session);
      if (sessionStartedError) {
        return reject(item.eventId, sessionStartedError);
      }
    }

    try {
      const insertResult = persistEvent(item, session, transitionId);
      if (insertResult === "duplicate") {
        return { eventId: item.eventId, status: "duplicate" };
      }
      return { eventId: item.eventId, status: "accepted" };
    } catch {
      return reject(item.eventId, "Failed to persist event");
    }
  }

  return { processBatch };
}
