import { beforeEach, describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import { getDatabase } from "@/system/database/connection";
import { buildApiState, getServices } from "@/system/http/funnel-api.helpers";
import { SessionService } from "@/system/sessions/session.service";
import { VersionService } from "@/system/versions/version.service";
import { createTestDatabase, destroyTestDatabase } from "@/tests/setup/test-database";

describe("funnel session API helpers", () => {
  beforeEach(() => {
    destroyTestDatabase();
    createTestDatabase();
    new VersionService(getDatabase()).publish(initialConfig);
  });

  test("create and restore returns same pending session_started id", () => {
    const { sessions } = getServices();
    const created = sessions.createNew({ variantOverride: "A" });
    const pending = created.pendingSessionStartedEventId;
    const restored = sessions.createOrRestore(created.sessionId, {});
    expect(restored.pendingSessionStartedEventId).toBe(pending);
    expect(buildApiState(restored).variant).toBe("A");
  });

  test("records immutable forward transition on answer flow", () => {
    const sessions = new SessionService(getDatabase());
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
