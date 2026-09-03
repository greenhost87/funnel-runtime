import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import iteration2Config from "@/fixtures/funnels/iteration-2.json";
import { createEventService } from "@/system/events/event.service";
import { createSessionService } from "@/system/sessions/session.service";
import { createVersionService } from "@/system/versions/version.service";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

describe("event service", () => {
  test("accepts required events and deduplicates", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const session = sessions.createNew({ variantOverride: "A" });
    const service = createEventService(db);
    const eventId = session.pendingSessionStartedEventId;
    if (!eventId) {
      throw new Error("Expected pending session_started event id");
    }

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
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const session = sessions.createNew({});
    const service = createEventService(db);
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

    const [nestedAnswerRejected] = service.processBatch([
      {
        eventId: crypto.randomUUID(),
        eventName: "answer_submitted",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
        stepId: "goal",
        properties: { meta: { answer: "secret" } },
      },
    ]);
    expect(nestedAnswerRejected?.status).toBe("rejected");

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
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const session = sessions.createNew({});
    const service = createEventService(db);
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

  test("accepts each required event type", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const session = sessions.createNew({ variantOverride: "A" });
    const service = createEventService(db);
    const transitionId = sessions.recordForwardTransition({
      sessionId: session.sessionId,
      fromStepId: "welcome",
      toStepId: "goal",
      toResult: false,
    });
    const startedEventId = session.pendingSessionStartedEventId;
    if (!startedEventId) {
      throw new Error("Expected pending session_started event id");
    }
    const timestamp = new Date().toISOString();

    const results = service.processBatch([
      {
        eventId: startedEventId,
        eventName: "session_started",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "step_viewed",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
        stepId: "welcome",
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "answer_submitted",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
        stepId: "goal",
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "step_completed",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
        stepId: "welcome",
        transitionId,
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "back_clicked",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
        stepId: "goal",
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "result_viewed",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
      },
      {
        eventId: crypto.randomUUID(),
        eventName: "cta_clicked",
        sessionId: session.sessionId,
        clientTimestamp: timestamp,
      },
    ]);

    expect(results.every((result) => result.status === "accepted")).toBe(true);
    expect(sessions.getSnapshot(session.sessionId)?.pendingSessionStartedEventId).toBeNull();
  });

  test("accepts config-declared custom event from pinned version", () => {
    const db = currentDatabase();
    createVersionService(db).publish(iteration2Config);
    const sessions = createSessionService(db);
    const session = sessions.createNew({});
    const service = createEventService(db);

    const [accepted] = service.processBatch([
      {
        eventId: crypto.randomUUID(),
        eventName: "premium_interest_signal",
        sessionId: session.sessionId,
        clientTimestamp: new Date().toISOString(),
        stepId: "goal",
        properties: { source: "test" },
      },
    ]);
    expect(accepted?.status).toBe("accepted");
  });
});
