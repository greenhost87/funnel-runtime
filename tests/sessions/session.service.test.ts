import { beforeEach, describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { getDatabase } from "@/system/database/connection";
import { SessionService } from "@/system/sessions/session.service";
import { VersionService } from "@/system/versions/version.service";
import { createTestDatabase, destroyTestDatabase } from "@/tests/setup/test-database";

describe("session service", () => {
  beforeEach(() => {
    destroyTestDatabase();
    createTestDatabase();
    new VersionService(getDatabase()).publish(initialConfig);
  });

  test("pins version and variant across restore", () => {
    const sessions = new SessionService(getDatabase());
    const created = sessions.createNew({ variantOverride: "A", utm: { utmCampaign: "spring" } });
    const restored = sessions.createOrRestore(created.sessionId, {});
    expect(restored.versionId).toBe(created.versionId);
    expect(restored.variant).toBe("A");
    expect(restored.pendingSessionStartedEventId).toBe(created.pendingSessionStartedEventId);
  });

  test("new session gets active version after publish", () => {
    const sessions = new SessionService(getDatabase());
    const old = sessions.createNew({ variantOverride: "B" });
    new VersionService(getDatabase()).publish(alternativeConfig);
    const restored = sessions.createOrRestore(old.sessionId, {});
    expect(restored.versionId).toBe(old.versionId);
    const fresh = sessions.createNew({});
    expect(fresh.versionId).not.toBe(old.versionId);
  });

  test("variant override applies only on new session", () => {
    const sessions = new SessionService(getDatabase());
    const created = sessions.createNew({ variantOverride: "A" });
    const overriddenRestore = sessions.createOrRestore(created.sessionId, { variantOverride: "B" });
    expect(overriddenRestore.variant).toBe("A");
    const fresh = sessions.createOrRestore(null, { variantOverride: "B" });
    expect(fresh.variant).toBe("B");
  });
});
