import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

describe("generate-traffic command", () => {
  test("creates at least 100 sessions and prints summary", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "funnel-gen-test-"));
    const dbPath = join(tempDir, "gen.sqlite");
    const result =
      await $`SQLITE_PATH=${dbPath} bun run scripts/generate-traffic.ts --seed 42 --sessions 120`.quiet();
    const payload = JSON.parse(result.stdout.toString()) as {
      sessions: number;
      summary: { sessionsStarted: number; primaryCtaFromStartConversion: number | null };
    };
    expect(payload.sessions).toBeGreaterThanOrEqual(100);
    expect(payload.summary.sessionsStarted).toBeGreaterThanOrEqual(100);
    expect(payload.summary.primaryCtaFromStartConversion).not.toBeNull();
    rmSync(tempDir, { recursive: true, force: true });
  }, 120000);
});
