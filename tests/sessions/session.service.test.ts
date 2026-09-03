import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { createSessionService } from "@/system/sessions/session.service";
import { createVersionService } from "@/system/versions/version.service";
import { useIsolatedTestDatabase } from "@/tests/setup/testDatabase";

const currentDatabase = useIsolatedTestDatabase(import.meta.path);

describe("session service", () => {
  test("pins version and variant across restore", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const created = sessions.createNew({ variantOverride: "A", utm: { utmCampaign: "spring" } });
    const restored = sessions.createOrRestore(created.sessionId, {});
    expect(restored.versionId).toBe(created.versionId);
    expect(restored.variant).toBe("A");
    expect(restored.pendingSessionStartedEventId).toBe(created.pendingSessionStartedEventId);
  });

  test("new session gets active version after publish", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const old = sessions.createNew({ variantOverride: "B" });
    createVersionService(db).publish(alternativeConfig);
    const restored = sessions.createOrRestore(old.sessionId, {});
    expect(restored.versionId).toBe(old.versionId);
    const fresh = sessions.createNew({});
    expect(fresh.versionId).not.toBe(old.versionId);
  });

  test("variant override applies only on new session", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const created = sessions.createNew({ variantOverride: "A" });
    const overriddenRestore = sessions.createOrRestore(created.sessionId, { variantOverride: "B" });
    expect(overriddenRestore.variant).toBe("A");
    const fresh = sessions.createOrRestore(null, { variantOverride: "B" });
    expect(fresh.variant).toBe("B");
  });

  test("records immutable forward transition on answer flow", () => {
    const db = currentDatabase();
    createVersionService(db).publish(initialConfig);
    const sessions = createSessionService(db);
    const snapshot = sessions.createNew({ variantOverride: "A" });
    const transitionId = sessions.recordForwardTransition({
      sessionId: snapshot.sessionId,
      fromStepId: "welcome",
      toStepId: "goal",
      toResult: false,
    });
    const transition = sessions.getTransitionDao().getTransition(transitionId);
    expect(transition?.from_step_id).toBe("welcome");
    expect(transition?.to_step_id).toBe("goal");
  });
});
