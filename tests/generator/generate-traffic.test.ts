import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { generateSyntheticTraffic } from "@/system/generator/traffic-generator";
import { createVersionService } from "@/system/versions/version.service";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

describe("generateSyntheticTraffic", () => {
  test("writes sessions for a selected version into the admin dashboard database", async () => {
    const db = currentDatabase();
    const versions = createVersionService(db);
    const initial = versions.publish(initialConfig);
    versions.publish(alternativeConfig);

    const { generatedSessions } = await generateSyntheticTraffic(db, {
      versionId: initial.versionId,
      sessionCount: 120,
      seed: 42,
    });
    const dashboard = createAnalyticsService(db).getDashboard();

    expect(generatedSessions).toBe(120);
    expect(dashboard.summary.sessionsStarted).toBe(120);
    expect(dashboard.summary.primaryCtaFromStartConversion).toBeCloseTo(34 / 120, 10);
    expect(dashboard.summary.resultReachRate).toBeCloseTo(59 / 120, 10);
    expect(dashboard.summary.ctaCtr).toBeCloseTo(34 / 59, 10);

    const versionIds = new Set(dashboard.comparisons.map((row) => row.versionId));
    expect(versionIds.size).toBe(1);
    expect(versionIds.has(initial.versionId)).toBe(true);
    expect(dashboard.comparisons.reduce((total, row) => total + row.started, 0)).toBe(120);
    expect(dashboard.campaigns).toEqual(["launch", "spring", "summer"]);

    const variants = db
      .query<{ count: number }, []>("SELECT COUNT(DISTINCT variant) AS count FROM sessions")
      .get();
    const backEvents = db
      .query<{ count: number }, []>(
        "SELECT COUNT(*) AS count FROM events WHERE event_name = 'back_clicked'",
      )
      .get();
    const repeatedViews = db
      .query<{ count: number }, []>(
        "SELECT COUNT(*) AS count FROM (SELECT session_id, step_id FROM events WHERE event_name = 'step_viewed' GROUP BY session_id, step_id HAVING COUNT(DISTINCT event_id) > 1)",
      )
      .get();
    const branchTransitions = db
      .query<{ count: number }, []>(
        "SELECT COUNT(*) AS count FROM session_transitions WHERE from_step_id = 'goal' AND to_step_id = 'training-frequency'",
      )
      .get();
    expect(variants?.count).toBe(2);
    expect(backEvents?.count).toBeGreaterThan(0);
    expect(repeatedViews?.count).toBeGreaterThan(0);
    expect(branchTransitions?.count).toBeGreaterThan(0);
  });

  test("anchors generated events to the requested date", async () => {
    const db = currentDatabase();
    const versions = createVersionService(db);
    const initial = versions.publish(initialConfig);

    await generateSyntheticTraffic(db, {
      versionId: initial.versionId,
      sessionCount: 120,
      seed: 42,
      anchorDate: "2025-06-15",
    });

    const dashboard = createAnalyticsService(db).getDashboard({
      dateFrom: "2025-06-15",
      dateTo: "2025-06-15",
    });
    expect(dashboard.summary.sessionsStarted).toBe(120);
    expect(dashboard.sessionsByDay).toEqual([{ date: "2025-06-15", sessions: 120 }]);
  });
});
