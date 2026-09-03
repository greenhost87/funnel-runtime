import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import { parseFunnelConfig } from "@/system/funnel/config.schema";
import {
  advanceInfo,
  createInitialState,
  goBack,
  submitAnswer,
} from "@/system/funnel/funnel-engine";
import { validateAnswer } from "@/system/funnel/answer-validation";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";

describe("funnel engine", () => {
  const config = parseFunnelConfig(initialConfig);

  test("validates answers by step type", () => {
    const effective = resolveEffectiveConfig(config, "A");
    const goalStep = effective.steps.find((step) => step.id === "goal");
    if (!goalStep) {
      throw new Error("Expected goal step");
    }
    expect(validateAnswer(goalStep, "energy").valid).toBe(true);
    expect(validateAnswer(goalStep, "invalid").valid).toBe(false);
  });

  test("follows fitness branch", () => {
    const effective = resolveEffectiveConfig(config, "A");
    let state = createInitialState(effective);
    state = advanceInfo(effective, state).state;
    const answered = submitAnswer(effective, state, "goal", "fitness");
    expect(answered.state.currentStepId).toBe("training-frequency");
  });

  test("supports back navigation", () => {
    const effective = resolveEffectiveConfig(config, "A");
    let state = createInitialState(effective);
    state = advanceInfo(effective, state).state;
    state = submitAnswer(effective, state, "goal", "energy").state;
    const backed = goBack(effective, state);
    expect(backed.currentStepId).toBe("goal");
    expect(backed.history.length).toBe(2);
  });

  test("variant B has different path length/progress baseline", () => {
    const effectiveA = resolveEffectiveConfig(config, "A");
    const effectiveB = resolveEffectiveConfig(config, "B");
    const stateA = createInitialState(effectiveA);
    const stateB = createInitialState(effectiveB);
    expect(stateA.currentStepId).toBe("welcome");
    expect(stateB.currentStepId).toBe("goal");
    expect(stateA.progress.total).not.toBe(stateB.progress.total);
  });
});
