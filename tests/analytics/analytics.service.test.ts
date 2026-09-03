import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { createEventService } from "@/system/events/event.service";
import { createSessionService } from "@/system/sessions/session.service";
import { createVersionService } from "@/system/versions/version.service";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

function seedAnalyticsScenario(db: ReturnType<typeof currentDatabase>) {
  const sessions = createSessionService(db);
  const events = createEventService(db);

  const s1 = sessions.createNew({ variantOverride: "A", utm: { utmCampaign: "alpha" } });
  const s2 = sessions.createNew({ variantOverride: "B", utm: { utmCampaign: "beta" } });

  const t1 = sessions.recordForwardTransition({
    sessionId: s1.sessionId,
    fromStepId: "welcome",
    toStepId: "goal",
    toResult: false,
  });

  const startedId1 = s1.pendingSessionStartedEventId;
  const startedId2 = s2.pendingSessionStartedEventId;
  if (!startedId1 || !startedId2) {
    throw new Error("Expected pending session_started event ids");
  }

  const batch = [
    {
      eventId: startedId1,
      eventName: "session_started",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:00:00.000Z",
    },
    {
      eventId: startedId2,
      eventName: "session_started",
      sessionId: s2.sessionId,
      clientTimestamp: "2026-01-02T10:01:00.000Z",
    },
    {
      eventId: crypto.randomUUID(),
      eventName: "step_viewed",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:02:00.000Z",
      stepId: "welcome",
    },
    {
      eventId: crypto.randomUUID(),
      eventName: "step_completed",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:03:00.000Z",
      stepId: "welcome",
      transitionId: t1,
    },
    {
      eventId: crypto.randomUUID(),
      eventName: "result_viewed",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:04:00.000Z",
    },
    {
      eventId: crypto.randomUUID(),
      eventName: "cta_clicked",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:05:00.000Z",
    },
    {
      eventId: crypto.randomUUID(),
      eventName: "step_viewed",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:06:00.000Z",
      stepId: "welcome",
    },
    {
      eventId: crypto.randomUUID(),
      eventName: "session_started",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:07:00.000Z",
    },
  ];

  events.processBatch(batch);
}

describe("analytics service", () => {
  test("computes unique session metrics and primary conversion", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    seedAnalyticsScenario(db);
    const dashboard = createAnalyticsService(db).getDashboard();
    expect(dashboard.summary.sessionsStarted).toBe(2);
    expect(dashboard.summary.primaryCtaFromStartConversion).toBe(0.5);
    expect(dashboard.summary.resultReachRate).toBe(0.5);
    expect(dashboard.summary.ctaCtr).toBe(1);
  });

  test("filters by utm campaign without divide-by-zero", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    seedAnalyticsScenario(db);
    const alpha = createAnalyticsService(db).getDashboard({ utmCampaign: "alpha" });
    expect(alpha.summary.sessionsStarted).toBe(1);
    expect(alpha.summary.primaryCtaFromStartConversion).toBe(1);

    const missing = createAnalyticsService(db).getDashboard({ utmCampaign: "missing" });
    expect(missing.summary.sessionsStarted).toBe(0);
    expect(missing.summary.primaryCtaFromStartConversion).toBeNull();
  });
});
