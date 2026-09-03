import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { createVersionDao } from "@/system/database/versions/version.dao";
import { createVersionService } from "@/system/versions/version.service";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

describe("version service", () => {
  test("publish, immutable snapshots, rollback", () => {
    const db = currentDatabase();
    const service = createVersionService(db);
    const first = service.publish(initialConfig);
    const second = service.publish(alternativeConfig);
    expect(second.versionId).not.toBe(first.versionId);

    const dao = createVersionDao(db);
    expect(dao.getVersionById(first.versionId)).not.toBeNull();
    expect(dao.getVersionById(second.versionId)).not.toBeNull();

    const rolled = service.rollbackToVersion(first.versionId);
    expect(rolled.versionId).toBe(first.versionId);
    expect(service.getActive()?.versionId).toBe(first.versionId);
    expect(service.getHistory().length).toBe(4);
  });
});
