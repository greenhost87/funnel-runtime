import type { Database } from "bun:sqlite";
import { validateBatchItem } from "@/system/events/event.schema";
import type { BatchEventInput, BatchEventResult } from "@/system/events/event.types";
import { sanitizeEventProperties } from "@/system/events/event.types";
import { EventDao } from "@/system/database/events/event.dao";
import { SessionDao } from "@/system/database/sessions/session.dao";
import { SessionTransitionDao } from "@/system/database/sessions/session.dao";
import { VersionService } from "@/system/versions/version.service";

export class EventService {
  private readonly events: EventDao;
  private readonly sessions: SessionDao;
  private readonly transitions: SessionTransitionDao;
  private readonly versions: VersionService;
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
    this.events = new EventDao(db);
    this.sessions = new SessionDao(db);
    this.transitions = new SessionTransitionDao(db);
    this.versions = new VersionService(db);
  }

  processBatch(items: BatchEventInput[]): BatchEventResult[] {
    return items.map((item) => this.processOne(item));
  }

  private processOne(item: BatchEventInput): BatchEventResult {
    const validationError = validateBatchItem(item);
    if (validationError) {
      return { eventId: item.eventId, status: "rejected", reason: validationError };
    }

    const session = this.sessions.getById(item.sessionId);
    if (!session) {
      return { eventId: item.eventId, status: "rejected", reason: "Unknown session" };
    }

    const config = this.versions.getConfigByVersionId(session.version_id);
    const allowedCustom = new Set(config.customEvents ?? []);
    const isBuiltIn = [
      "session_started",
      "step_viewed",
      "answer_submitted",
      "step_completed",
      "back_clicked",
      "result_viewed",
      "cta_clicked",
    ].includes(item.eventName);
    if (!isBuiltIn && !allowedCustom.has(item.eventName)) {
      return { eventId: item.eventId, status: "rejected", reason: "Event not declared in config" };
    }

    let transitionId: string | null = null;
    if (item.eventName === "step_completed") {
      const transition = this.transitions.getTransition(item.transitionId!);
      if (!transition) {
        return { eventId: item.eventId, status: "rejected", reason: "Unknown transition" };
      }
      if (transition.session_id !== item.sessionId) {
        return {
          eventId: item.eventId,
          status: "rejected",
          reason: "Transition belongs to another session",
        };
      }
      if (item.stepId && transition.from_step_id !== item.stepId) {
        return { eventId: item.eventId, status: "rejected", reason: "Transition step mismatch" };
      }
      if (this.transitions.isTransitionLinkedToCompletion(item.transitionId!)) {
        return {
          eventId: item.eventId,
          status: "rejected",
          reason: "Transition already completed",
        };
      }
      transitionId = item.transitionId!;
    }

    const insertResult = this.events.insertEvent({
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

    if (insertResult === "duplicate") {
      if (item.eventName === "session_started") {
        this.sessions.markSessionStartedRecorded(item.sessionId, item.eventId);
      }
      return { eventId: item.eventId, status: "duplicate" };
    }

    if (item.eventName === "session_started") {
      if (session.session_started_event_id !== item.eventId) {
        return {
          eventId: item.eventId,
          status: "rejected",
          reason: "session_started event id mismatch",
        };
      }
      this.sessions.markSessionStartedRecorded(item.sessionId, item.eventId);
    }

    return { eventId: item.eventId, status: "accepted" };
  }
}
