import { argv } from "bun";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { setEnv } from "@/system/config/environment";
import { closeDatabase, getDatabase } from "@/system/database/connection";
import { runDatabaseMigrations } from "@/system/database/migrate";
import { createEventService } from "@/system/events/event.service";
import { advanceInfo, createInitialState, submitAnswer } from "@/system/funnel/funnel-engine";
import type { AdvanceResult } from "@/system/funnel/funnel-engine";
import type { FunnelSessionState } from "@/system/funnel/config.types";
import { createSessionService } from "@/system/sessions/session.service";
import { createVersionService, type ActiveVersionSnapshot } from "@/system/versions/version.service";

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function applyAdvancedTransition(
  sessions: ReturnType<typeof createSessionService>,
  sessionId: string,
  state: FunnelSessionState,
  advanced: AdvanceResult,
) {
  return sessions.applyForwardTransition(
    sessionId,
    {
      answers: advanced.state.answers,
      currentStepId: advanced.state.currentStepId,
      isResult: advanced.state.isResult,
      history: advanced.state.history,
    },
    {
      fromStepId: advanced.transition.fromStepId,
      toStepId: advanced.transition.toStepId,
      toResult: advanced.transition.toResult,
    },
    { currentStepId: state.currentStepId, isResult: state.isResult },
  );
}

const { values } = parseArgs({
  args: argv.slice(2),
  options: {
    seed: { type: "string", default: "42" },
    sessions: { type: "string", default: "120" },
  },
});

const seed = Number(values.seed);
const sessionCount = Number(values.sessions);
const random = createSeededRandom(seed);

const tempDir = mkdtempSync(join(tmpdir(), "funnel-traffic-"));
const dbPath = join(tempDir, "traffic.sqlite");
setEnv("SQLITE_PATH", dbPath);
closeDatabase();
const db = getDatabase();
runDatabaseMigrations({ database: db });

const versions = createVersionService(db);
const v1 = versions.publish(initialConfig);

const sessions = createSessionService(db);
const events = createEventService(db);
const campaigns = ["spring", "summer", "launch"];
const versionSplit = Math.floor(sessionCount / 2);
let v2: ActiveVersionSnapshot | null = null;

for (let index = 0; index < sessionCount; index += 1) {
  if (index === versionSplit) {
    v2 = versions.publish(alternativeConfig);
  }
  const variant = random() < 0.5 ? "A" : "B";
  const campaign = campaigns[index % campaigns.length] ?? "spring";
  const session = sessions.createNew({
    variantOverride: variant,
    utm: { utmCampaign: campaign, utmSource: "generator", utmMedium: "synthetic" },
  });

  const config = sessions.getEffectiveConfigForSession(session.sessionId);
  let state = createInitialState(config);
  const startedId = session.pendingSessionStartedEventId;
  if (!startedId) {
    continue;
  }
  const batch: Array<{
    eventId: string;
    eventName: string;
    sessionId: string;
    clientTimestamp: string;
    stepId?: string;
    transitionId?: string;
    properties?: Record<string, unknown>;
  }> = [
    {
      eventId: startedId,
      eventName: "session_started",
      sessionId: session.sessionId,
      clientTimestamp: new Date(Date.now() + index).toISOString(),
    },
  ];

  const dropAfterSteps = Math.floor(random() * 6);
  let stepsWalked = 0;

  while (!state.isResult && state.currentStepId) {
    const step = config.steps.find((item) => item.id === state.currentStepId);
    if (!step) {
      break;
    }

    batch.push({
      eventId: crypto.randomUUID(),
      eventName: "step_viewed",
      sessionId: session.sessionId,
      clientTimestamp: new Date(Date.now() + index + stepsWalked).toISOString(),
      stepId: step.id,
    });

    if (stepsWalked >= dropAfterSteps && random() < 0.25) {
      break;
    }

    let transitionId: string;
    if (step.type === "info") {
      const advanced = advanceInfo(config, state);
      ({ transitionId } = applyAdvancedTransition(sessions, session.sessionId, state, advanced));
      state = advanced.state;
    } else {
      const answer =
        step.type === "single-select"
          ? (step.options[Math.floor(random() * step.options.length)]?.id ?? "energy")
          : step.type === "multi-select"
            ? [step.options[0]?.id ?? "nutrition"]
            : Math.floor(random() * 500);
      const advanced = submitAnswer(config, state, step.id, answer);
      ({ transitionId } = applyAdvancedTransition(sessions, session.sessionId, state, advanced));
      state = advanced.state;
      batch.push({
        eventId: crypto.randomUUID(),
        eventName: "answer_submitted",
        sessionId: session.sessionId,
        clientTimestamp: new Date(Date.now() + index + stepsWalked + 0.1).toISOString(),
        stepId: step.id,
      });
    }

    batch.push({
      eventId: crypto.randomUUID(),
      eventName: "step_completed",
      sessionId: session.sessionId,
      clientTimestamp: new Date(Date.now() + index + stepsWalked + 0.2).toISOString(),
      stepId: step.id,
      transitionId,
    });

    stepsWalked += 1;

    if (state.isResult) {
      batch.push({
        eventId: crypto.randomUUID(),
        eventName: "result_viewed",
        sessionId: session.sessionId,
        clientTimestamp: new Date(Date.now() + index + stepsWalked + 0.3).toISOString(),
      });
      if (random() < 0.6) {
        batch.push({
          eventId: crypto.randomUUID(),
          eventName: "cta_clicked",
          sessionId: session.sessionId,
          clientTimestamp: new Date(Date.now() + index + stepsWalked + 0.4).toISOString(),
        });
      }
    }
  }

  if (index % 17 === 0) {
    events.processBatch(batch);
    events.processBatch(batch);
  } else if (index % 11 === 0) {
    const shuffled = [...batch].reverse();
    events.processBatch(shuffled);
  } else {
    events.processBatch(batch);
  }
}

const dashboard = createAnalyticsService(db).getDashboard();
console.log(
  "%s",
  JSON.stringify(
    {
      seed,
      sessions: sessionCount,
      versions: { initial: v1.versionId, alternative: v2?.versionId ?? null },
      summary: dashboard.summary,
      versionBreakdown: dashboard.comparisons.map((row) => ({
        versionId: row.versionId,
        variant: row.variant,
        started: row.started,
      })),
    },
    null,
    2,
  ),
);

closeDatabase();
rmSync(tempDir, { recursive: true, force: true });
