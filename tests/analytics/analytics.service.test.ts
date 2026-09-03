import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import { AnalyticsService } from "@/system/analytics/analytics.service";
import { getDatabase } from "@/system/database/connection";
import { EventService } from "@/system/events/event.service";
import { SessionService } from "@/system/sessions/session.service";
import { VersionService } from "@/system/versions/version.service";
import { createTestDatabase, destroyTestDatabase } from "@/tests/setup/test-database";

function seedAnalyticsScenario() {
  const sessions = new SessionService(getDatabase());
  const events = new EventService(getDatabase());

  const s1 = sessions.createNew({ variantOverride: "A", utm: { utmCampaign: "alpha" } });
  const s2 = sessions.createNew({ variantOverride: "B", utm: { utmCampaign: "beta" } });

  const t1 = sessions.recordForwardTransition({
    sessionId: s1.sessionId,
    fromStepId: "welcome",
    toStepId: "goal",
    toResult: false,
  });

  const batch = [
    {
      eventId: s1.pendingSessionStartedEventId!,
      eventName: "session_started",
      sessionId: s1.sessionId,
      clientTimestamp: "2026-01-02T10:00:00.000Z",
    },
    {
      eventId: s2.pendingSessionStartedEventId!,
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
  beforeEach(() => {
    destroyTestDatabase();
    createTestDatabase();
    new VersionService(getDatabase()).publish(initialConfig);
    seedAnalyticsScenario();
  });

  test("computes unique session metrics and primary conversion", () => {
    const dashboard = new AnalyticsService(getDatabase()).getDashboard();
    expect(dashboard.summary.sessionsStarted).toBe(2);
    expect(dashboard.summary.primaryCtaFromStartConversion).toBe(0.5);
    expect(dashboard.summary.resultReachRate).toBe(0.5);
    expect(dashboard.summary.ctaCtr).toBe(1);
  });

  test("filters by utm campaign without divide-by-zero", () => {
    const alpha = new AnalyticsService(getDatabase()).getDashboard({ utmCampaign: "alpha" });
    expect(alpha.summary.sessionsStarted).toBe(1);
    expect(alpha.summary.primaryCtaFromStartConversion).toBe(1);

    const missing = new AnalyticsService(getDatabase()).getDashboard({ utmCampaign: "missing" });
    expect(missing.summary.sessionsStarted).toBe(0);
    expect(missing.summary.primaryCtaFromStartConversion).toBeNull();
  });
});
