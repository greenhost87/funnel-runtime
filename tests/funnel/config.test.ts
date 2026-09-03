import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import iteration2Config from "@/fixtures/funnels/iteration-2.json";
import { parseFunnelConfig } from "@/system/funnel/config.schema";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";
import { advanceInfo, createInitialState, submitAnswer } from "@/system/funnel/funnel-engine";
import type { JsonValue } from "@/system/http/json";

function expectInvalidConfig(input: JsonValue): void {
  expect(() => parseFunnelConfig(input)).toThrow();
}

describe("funnel config contract", () => {
  test("variant B changes text, order, and result vs A", () => {
    const config = parseFunnelConfig(initialConfig);
    const variantA = resolveEffectiveConfig(config, "A");
    const variantB = resolveEffectiveConfig(config, "B");

    expect(variantA.steps.map((step) => step.id)).not.toEqual(
      variantB.steps.map((step) => step.id),
    );
    expect(variantB.steps[0]?.id).toBe("goal");
    expect(variantA.result.title).not.toBe(variantB.result.title);
    expect(variantB.steps.find((step) => step.id === "goal")?.title).toBe("Pick your #1 goal");

    const started = createInitialState(variantB);
    expect(submitAnswer(variantB, started, "goal", "energy").state.currentStepId).toBe("timeline");
  });

  test("rejects broken references", () => {
    const broken = {
      ...initialConfig,
      steps: initialConfig.steps.map((step) =>
        step.id === "welcome"
          ? {
              ...step,
              transitions: [{ id: "x", target: { type: "step", stepId: "missing" } }],
            }
          : step,
      ),
    };
    expectInvalidConfig(broken);
  });

  test("rejects variant with broken excluded step reference", () => {
    const broken = {
      ...initialConfig,
      variants: {
        ...initialConfig.variants,
        B: { excludedStepIds: ["does-not-exist"] },
      },
    };
    expectInvalidConfig(broken);
  });

  test("rejects unknown step types", () => {
    const broken = {
      ...initialConfig,
      steps: [
        {
          id: "broken",
          type: "free-text",
          title: "Unsupported",
          transitions: [{ id: "broken-next", target: { type: "result" } }],
        },
      ],
    };
    expectInvalidConfig(broken);
  });

  test("rejects variant with broken effective transitions", () => {
    const broken = {
      ...initialConfig,
      variants: {
        ...initialConfig.variants,
        B: { excludedStepIds: ["habits"] },
      },
    };
    expect(() => parseFunnelConfig(broken)).toThrow(/Variant B effective config invalid/);
  });

  test("iteration-2 B has an executable five-step ordered flow", () => {
    const config = parseFunnelConfig(iteration2Config);
    const variantB = resolveEffectiveConfig(config, "B");
    expect(variantB.steps.map((step) => step.id)).toEqual([
      "goal",
      "timeline",
      "habits",
      "budget",
      "summary",
    ]);

    let state = createInitialState(variantB);
    state = submitAnswer(variantB, state, "goal", "premium").state;
    expect(state.currentStepId).toBe("timeline");
    state = submitAnswer(variantB, state, "timeline", "1month").state;
    state = submitAnswer(variantB, state, "habits", ["sleep"]).state;
    state = submitAnswer(variantB, state, "budget", 100).state;
    state = advanceInfo(variantB, state).state;
    expect(state.isResult).toBe(true);
  });

  test("rejects duplicate step ids in a variant order", () => {
    expectInvalidConfig({
      ...initialConfig,
      variants: {
        ...initialConfig.variants,
        B: { stepOrder: ["goal", "goal"] },
      },
    });
  });
});
