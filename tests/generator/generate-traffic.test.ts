import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

describe("generate-traffic command", () => {
  test("creates sessions across two versions with deterministic aggregates", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "funnel-gen-test-"));
    const dbPath = join(tempDir, "gen.sqlite");
    const result =
      await $`SQLITE_PATH=${dbPath} bun run scripts/generate-traffic.ts --seed 42 --sessions 120`.quiet();
    const TrafficPayloadSchema = v.object({
      sessions: v.number(),
      summary: v.object({
        sessionsStarted: v.number(),
        primaryCtaFromStartConversion: v.nullable(v.number()),
        resultReachRate: v.nullable(v.number()),
        ctaCtr: v.nullable(v.number()),
      }),
      versionBreakdown: v.array(
        v.object({
          versionId: v.string(),
          variant: v.string(),
          started: v.number(),
        }),
      ),
    });
    const payload = v.parse(
      v.pipe(v.string(), v.parseJson(), TrafficPayloadSchema),
      result.stdout.toString(),
    );

    expect(payload.sessions).toBe(120);
    expect(payload.summary.sessionsStarted).toBe(120);
    expect(payload.summary.primaryCtaFromStartConversion).toBeCloseTo(0.2916666666666667, 10);
    expect(payload.summary.resultReachRate).toBeCloseTo(0.475, 10);
    expect(payload.summary.ctaCtr).toBeCloseTo(0.6140350877192983, 10);

    const versionIds = new Set(payload.versionBreakdown.map((row) => row.versionId));
    expect(versionIds.size).toBe(2);
    expect(payload.versionBreakdown.reduce((total, row) => total + row.started, 0)).toBe(120);

    rmSync(tempDir, { recursive: true, force: true });
  }, 120000);
});
