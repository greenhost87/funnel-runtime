import { getStoredAnswer } from "./answer-validation";
import type {
  AnswerValue,
  EffectiveFunnelConfig,
  FunnelAnswers,
  FunnelSessionState,
  FunnelStep,
  StepTransition,
  TransitionTarget,
} from "./config.types";
import { getStepById, matchesCondition } from "./variant-resolver";

function buildProgress(current: number, total: number) {
  return {
    current,
    total,
    percent: total > 0 ? Math.round((current / total) * 100) : 0,
  };
}

export function createInitialState(config: EffectiveFunnelConfig): FunnelSessionState {
  const firstStep = config.steps[0];
  if (!firstStep) {
    throw new Error("Funnel has no steps");
  }
  const total = countReachableSteps(config, {});
  return {
    currentStepId: firstStep.id,
    isResult: false,
    answers: {},
    history: [firstStep.id],
    progress: buildProgress(1, total),
  };
}

export function restoreState(
  config: EffectiveFunnelConfig,
  answers: FunnelAnswers,
  currentStepId: string | null,
  isResult: boolean,
  history: string[],
): FunnelSessionState {
  const total = countReachableSteps(config, answers);
  const current = isResult ? total : Math.max(1, history.length);
  return {
    currentStepId,
    isResult,
    answers,
    history,
    progress: buildProgress(current, total),
  };
}

function selectTransition(
  step: FunnelStep,
  answer: AnswerValue | undefined,
): StepTransition | undefined {
  const conditional = step.transitions.filter((transition) => transition.when);
  for (const transition of conditional) {
    if (transition.when && matchesCondition(transition.when, answer)) {
      return transition;
    }
  }
  return step.transitions.find((transition) => !transition.when);
}

function resolveTarget(
  config: EffectiveFunnelConfig,
  target: TransitionTarget,
): { stepId: string | null; isResult: boolean } {
  if (target.type === "result") {
    return { stepId: null, isResult: true };
  }
  if (!getStepById(config, target.stepId)) {
    throw new Error(`Unknown target step: ${target.stepId}`);
  }
  return { stepId: target.stepId, isResult: false };
}

export type AdvanceResult = {
  state: FunnelSessionState;
  transition: {
    fromStepId: string;
    toStepId: string | null;
    toResult: boolean;
  };
};

function advanceFromStep(
  config: EffectiveFunnelConfig,
  state: FunnelSessionState,
  fromStepId: string,
  answer?: AnswerValue,
): AdvanceResult {
  const step = getStepById(config, fromStepId);
  if (!step) {
    throw new Error(`Unknown step: ${fromStepId}`);
  }

  const storedAnswer = answer ?? getStoredAnswer(state.answers, fromStepId);
  const transition = selectTransition(step, storedAnswer);
  if (!transition) {
    throw new Error(`No transition defined for step ${fromStepId}`);
  }

  const next = resolveTarget(config, transition.target);
  const answers = answer !== undefined ? { ...state.answers, [fromStepId]: answer } : state.answers;
  const nextStepId = next.stepId;
  if (!next.isResult && !nextStepId) {
    throw new Error(`Transition target step is missing for ${fromStepId}`);
  }
  const history = (() => {
    if (next.isResult) {
      return state.history;
    }
    if (!nextStepId) {
      throw new Error(`Transition target step is missing for ${fromStepId}`);
    }
    return [...state.history, nextStepId];
  })();
  const total = countReachableSteps(config, answers);
  const current = next.isResult ? total : history.length;

  return {
    state: {
      currentStepId: next.stepId,
      isResult: next.isResult,
      answers,
      history,
      progress: buildProgress(current, total),
    },
    transition: {
      fromStepId,
      toStepId: next.stepId,
      toResult: next.isResult,
    },
  };
}

export function submitAnswer(
  config: EffectiveFunnelConfig,
  state: FunnelSessionState,
  stepId: string,
  answer: AnswerValue,
): AdvanceResult {
  if (state.isResult) {
    throw new Error("Cannot submit answer on result screen");
  }
  if (state.currentStepId !== stepId) {
    throw new Error("Answer does not match current step");
  }
  const step = getStepById(config, stepId);
  if (!step || step.type === "info") {
    throw new Error("Current step does not accept answers");
  }
  return advanceFromStep(config, state, stepId, answer);
}

export function advanceInfo(
  config: EffectiveFunnelConfig,
  state: FunnelSessionState,
): AdvanceResult {
  if (state.isResult) {
    throw new Error("Already on result screen");
  }
  const stepId = state.currentStepId;
  if (!stepId) {
    throw new Error("No current step");
  }
  const step = getStepById(config, stepId);
  if (step?.type !== "info") {
    throw new Error("Current step is not info");
  }
  return advanceFromStep(config, state, stepId);
}

export function goBack(
  config: EffectiveFunnelConfig,
  state: FunnelSessionState,
): FunnelSessionState {
  if (state.history.length <= 1 || state.isResult) {
    return state;
  }
  const history = state.history.slice(0, -1);
  const currentStepId = history[history.length - 1] ?? null;
  const total = countReachableSteps(config, state.answers);
  return {
    ...state,
    currentStepId,
    isResult: false,
    history,
    progress: buildProgress(history.length, total),
  };
}

function countReachableSteps(config: EffectiveFunnelConfig, answers: FunnelAnswers): number {
  const visited = new Set<string>();
  const firstStepId = config.steps[0]?.id;
  const queue: string[] = firstStepId ? [firstStepId] : [];

  while (queue.length > 0) {
    const stepId = queue.shift();
    if (!stepId || visited.has(stepId)) {
      continue;
    }
    visited.add(stepId);
    const step = getStepById(config, stepId);
    if (!step) {
      continue;
    }
    const answer = getStoredAnswer(answers, stepId);
    const transition = selectTransition(step, answer);
    if (!transition) {
      continue;
    }
    if (transition.target.type === "result") {
      continue;
    }
    queue.push(transition.target.stepId);
  }

  return Math.max(visited.size, 1);
}
