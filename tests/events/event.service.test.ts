import { beforeEach, describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import { getDatabase } from "@/system/database/connection";
import { EventService } from "@/system/events/event.service";
import { SessionService } from "@/system/sessions/session.service";
import { VersionService } from "@/system/versions/version.service";
import { createTestDatabase, destroyTestDatabase } from "@/tests/setup/test-database";

describe("event service", () => {
  beforeEach(() => {
    destroyTestDatabase();
    createTestDatabase();
    new VersionService(getDatabase()).publish(initialConfig);
  });

  test("accepts required events and deduplicates", () => {
    const sessions = new SessionService(getDatabase());
    const session = sessions.createNew({ variantOverride: "A" });
    const service = new EventService(getDatabase());
    const eventId = session.pendingSessionStartedEventId!;

    const first = service.processBatch([
      {
        eventId,
        eventName: "session_started",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
      },
    ]);
    expect(first[0]?.status).toBe("accepted");

    const duplicate = service.processBatch([
      {
        eventId,
        eventName: "session_started",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
      },
    ]);
    expect(duplicate[0]?.status).toBe("duplicate");
    expect(sessions.getSnapshot(session.sessionId)?.pendingSessionStartedEventId).toBeNull();
  });

  test("rejects undeclared custom event and raw answer properties", () => {
    const sessions = new SessionService(getDatabase());
    const session = sessions.createNew({});
    const service = new EventService(getDatabase());
    const [customRejected] = service.processBatch([
      {
        eventId: crypto.randomUUID(),
        eventName: "unknown_event",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
      },
    ]);
    expect(customRejected?.status).toBe("rejected");

    const transitionId = sessions.recordForwardTransition({
      sessionId: session.sessionId,
      fromStepId: "welcome",
      toStepId: "goal",
      toResult: false,
    });
    const [answerRejected] = service.processBatch([
      {
        eventId: crypto.randomUUID(),
        eventName: "answer_submitted",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
        stepId: "goal",
        properties: { answer: "secret" },
      },
    ]);
    expect(answerRejected?.status).toBe("rejected");

    const [completionRejected] = service.processBatch([
      {
        eventId: crypto.randomUUID(),
        eventName: "step_completed",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
        stepId: "wrong-step",
        transitionId,
      },
    ]);
    expect(completionRejected?.status).toBe("rejected");
  });

  test("partial batch acceptance", () => {
    const sessions = new SessionService(getDatabase());
    const session = sessions.createNew({});
    const service = new EventService(getDatabase());
    const results = service.processBatch([
      {
        eventId: crypto.randomUUID(),
        eventName: "step_viewed",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
        stepId: "welcome",
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "step_completed",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
        stepId: "welcome",
      },
    ]);
    expect(results[0]?.status).toBe("accepted");
    expect(results[1]?.status).toBe("rejected");
  });
});
