import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { generateSyntheticTraffic } from "@/system/generator/traffic-generator";
import { createVersionService } from "@/system/versions/version.service";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

describe("generate-traffic command", () => {
  test("writes sessions for a selected version into the admin dashboard database", () => {
    const db = currentDatabase();
    const versions = createVersionService(db);
    const initial = versions.publish(initialConfig);
    versions.publish(alternativeConfig);

    const { generatedSessions } = generateSyntheticTraffic(db, {
      versionId: initial.versionId,
      sessionCount: 120,
      seed: 42,
    });
    const dashboard = createAnalyticsService(db).getDashboard();

    expect(generatedSessions).toBe(120);
    expect(dashboard.summary.sessionsStarted).toBe(120);
    expect(dashboard.summary.primaryCtaFromStartConversion).toBeCloseTo(0.2916666666666667, 10);
    expect(dashboard.summary.resultReachRate).toBeCloseTo(0.475, 10);
    expect(dashboard.summary.ctaCtr).toBeCloseTo(0.6140350877192983, 10);

    const versionIds = new Set(dashboard.comparisons.map((row) => row.versionId));
    expect(versionIds.size).toBe(1);
    expect(versionIds.has(initial.versionId)).toBe(true);
    expect(dashboard.comparisons.reduce((total, row) => total + row.started, 0)).toBe(120);
    expect(dashboard.campaigns.length).toBeGreaterThan(0);
  });

  test("prints dashboard instructions when run as a command", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "funnel-gen-test-"));
    const dbPath = join(tempDir, "gen.sqlite");
    const result =
      await $`SQLITE_PATH=${dbPath} bun run scripts/generate-traffic.ts --seed 42 --sessions 120`.quiet();

    expect(result.stdout.toString()).toContain("Open http://localhost:3000/admin");
    expect(result.stdout.toString()).toContain("Generated 120 synthetic sessions");

    rmSync(tempDir, { recursive: true, force: true });
  }, 120000);
});
