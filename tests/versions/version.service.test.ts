import { beforeEach, describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { getDatabase } from "@/system/database/connection";
import { VersionDao } from "@/system/database/versions/version.dao";
import { VersionService } from "@/system/versions/version.service";
import { createTestDatabase, destroyTestDatabase } from "@/tests/setup/test-database";

describe("version service", () => {
  beforeEach(() => {
    destroyTestDatabase();
    createTestDatabase();
  });

  test("publish, immutable snapshots, rollback", () => {
    const service = new VersionService(getDatabase());
    const first = service.publish(initialConfig);
    const second = service.publish(alternativeConfig);
    expect(second.versionId).not.toBe(first.versionId);

    const dao = new VersionDao(getDatabase());
    expect(dao.getVersionById(first.versionId)).not.toBeNull();
    expect(dao.getVersionById(second.versionId)).not.toBeNull();

    const rolled = service.rollbackToVersion(first.versionId);
    expect(rolled.versionId).toBe(first.versionId);
    expect(service.getActive()?.versionId).toBe(first.versionId);
    expect(service.getHistory().length).toBe(3);
  });
});
