import type { Database } from "bun:sqlite";
import type { EffectiveFunnelConfig, FunnelSessionState, FunnelStep } from "@/system/funnel/config.types";
import { createEventService } from "@/system/events/event.service";
import type { BatchEventInput } from "@/system/events/event.types";
import { advanceInfo, createInitialState, submitAnswer } from "@/system/funnel/funnel-engine";
import type { AdvanceResult } from "@/system/funnel/funnel-engine";
import { createSessionService, type SessionSnapshot } from "@/system/sessions/session.service";
import { createVersionService } from "@/system/versions/version.service";

export type GenerateSyntheticTrafficOptions = {
  versionId: string;
  sessionCount: number;
  seed?: number;
};

export type GenerateSyntheticTrafficResult = {
  generatedSessions: number;
};

type RandomFn = () => number;

type SessionService = ReturnType<typeof createSessionService>;

type BuildSessionEventsInput = {
  sessions: SessionService;
  session: SessionSnapshot;
  config: EffectiveFunnelConfig;
  index: number;
  random: RandomFn;
};

type AdvanceSessionStepInput = {
  sessions: SessionService;
  sessionId: string;
  config: EffectiveFunnelConfig;
  state: FunnelSessionState;
  step: FunnelStep;
  index: number;
  stepsWalked: number;
  random: RandomFn;
  batch: BatchEventInput[];
};

type SessionWalkResult = {
  state: FunnelSessionState;
  stepsWalked: number;
};

const CAMPAIGNS = ["spring", "summer", "launch", "autumn", "winter", "referral"];
const SEEDED_CAMPAIGNS = ["spring", "summer", "launch"];

function pickCampaign(index: number, random: RandomFn, seeded: boolean): string {
  if (seeded) {
    return SEEDED_CAMPAIGNS[index % SEEDED_CAMPAIGNS.length] ?? "spring";
  }
  return CAMPAIGNS[Math.floor(random() * CAMPAIGNS.length)] ?? "spring";
}

function createSeededRandom(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function generateSyntheticTraffic(
  db: Database,
  options: GenerateSyntheticTrafficOptions,
): GenerateSyntheticTrafficResult {
  const versions = createVersionService(db);
  versions.getConfigByVersionId(options.versionId);

  const sessions = createSessionService(db);
  const events = createEventService(db);
  const random = options.seed === undefined ? Math.random : createSeededRandom(options.seed);
  const seeded = options.seed !== undefined;
  let generatedSessions = 0;

  for (let index = 0; index < options.sessionCount; index += 1) {
    const variant = random() < 0.5 ? "A" : "B";
    const campaign = pickCampaign(index, random, seeded);
    const session = sessions.createNew({
      versionId: options.versionId,
      variantOverride: variant,
      utm: { utmCampaign: campaign, utmSource: "generator", utmMedium: "synthetic" },
    });

    const config = sessions.getEffectiveConfigForSession(session.sessionId);
    const batch = buildSessionEvents({
      sessions,
      session,
      config,
      index,
      random,
    });
    if (!batch) {
      continue;
    }

    deliverEventBatch(events, batch, index);
    generatedSessions += 1;
  }

  return { generatedSessions };
}

function buildSessionEvents(input: BuildSessionEventsInput): BatchEventInput[] | null {
  const startedId = input.session.pendingSessionStartedEventId;
  if (!startedId) {
    return null;
  }

  let state = createInitialState(input.config);
  const batch: BatchEventInput[] = [
    {
      eventId: startedId,
      eventName: "session_started",
      sessionId: input.session.sessionId,
      clientTimestamp: new Date(Date.now() + input.index).toISOString(),
    },
  ];

  const dropAfterSteps = Math.floor(input.random() * 6);
  let stepsWalked = 0;

  while (!state.isResult && state.currentStepId) {
    const step = input.config.steps.find((item) => item.id === state.currentStepId);
    if (!step) {
      break;
    }

    batch.push(createStepViewedEvent(input.session.sessionId, step.id, input.index, stepsWalked));

    if (stepsWalked >= dropAfterSteps && input.random() < 0.25) {
      break;
    }

    const walked = advanceSessionStep({
      sessions: input.sessions,
      sessionId: input.session.sessionId,
      config: input.config,
      state,
      step,
      index: input.index,
      stepsWalked,
      random: input.random,
      batch,
    });
    state = walked.state;
    stepsWalked = walked.stepsWalked;

    if (state.isResult) {
      appendResultEvents(batch, input.session.sessionId, input.index, stepsWalked, input.random);
    }
  }

  return batch;
}

function createStepViewedEvent(
  sessionId: string,
  stepId: string,
  index: number,
  stepsWalked: number,
): BatchEventInput {
  return {
    eventId: crypto.randomUUID(),
    eventName: "step_viewed",
    sessionId,
    clientTimestamp: new Date(Date.now() + index + stepsWalked).toISOString(),
    stepId,
  };
}

function advanceSessionStep(input: AdvanceSessionStepInput): SessionWalkResult {
  if (input.step.type === "info") {
    const advanced = advanceInfo(input.config, input.state);
    const { transitionId } = applyAdvancedTransition(
      input.sessions,
      input.sessionId,
      input.state,
      advanced,
    );
    appendStepCompleted(input, transitionId);
    return { state: advanced.state, stepsWalked: input.stepsWalked + 1 };
  }

  const answer = pickStepAnswer(input.step, input.random);
  const advanced = submitAnswer(input.config, input.state, input.step.id, answer);
  const { transitionId } = applyAdvancedTransition(
    input.sessions,
    input.sessionId,
    input.state,
    advanced,
  );
  input.batch.push({
    eventId: crypto.randomUUID(),
    eventName: "answer_submitted",
    sessionId: input.sessionId,
    clientTimestamp: new Date(Date.now() + input.index + input.stepsWalked + 0.1).toISOString(),
    stepId: input.step.id,
  });
  appendStepCompleted(input, transitionId);
  return { state: advanced.state, stepsWalked: input.stepsWalked + 1 };
}

function appendStepCompleted(input: AdvanceSessionStepInput, transitionId: string) {
  input.batch.push({
    eventId: crypto.randomUUID(),
    eventName: "step_completed",
    sessionId: input.sessionId,
    clientTimestamp: new Date(Date.now() + input.index + input.stepsWalked + 0.2).toISOString(),
    stepId: input.step.id,
    transitionId,
  });
}

function pickStepAnswer(step: FunnelStep, random: RandomFn) {
  if (step.type === "single-select") {
    return step.options[Math.floor(random() * step.options.length)]?.id ?? step.options[0]?.id ?? "energy";
  }
  if (step.type === "multi-select") {
    return [step.options[0]?.id ?? "nutrition"];
  }
  return Math.floor(random() * 500);
}

function appendResultEvents(
  batch: BatchEventInput[],
  sessionId: string,
  index: number,
  stepsWalked: number,
  random: RandomFn,
) {
  batch.push({
    eventId: crypto.randomUUID(),
    eventName: "result_viewed",
    sessionId,
    clientTimestamp: new Date(Date.now() + index + stepsWalked + 0.3).toISOString(),
  });
  if (random() < 0.6) {
    batch.push({
      eventId: crypto.randomUUID(),
      eventName: "cta_clicked",
      sessionId,
      clientTimestamp: new Date(Date.now() + index + stepsWalked + 0.4).toISOString(),
    });
  }
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

function deliverEventBatch(
  events: ReturnType<typeof createEventService>,
  batch: BatchEventInput[],
  index: number,
) {
  if (index % 17 === 0) {
    events.processBatch(batch);
    events.processBatch(batch);
    return;
  }
  if (index % 11 === 0) {
    events.processBatch([...batch].reverse());
    return;
  }
  events.processBatch(batch);
}
