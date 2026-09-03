import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import iteration2Config from "@/fixtures/funnels/iteration-2.json";
import { parseFunnelConfig } from "@/system/funnel/config.schema";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";
import type { JsonValue } from "@/system/http/json";

function expectInvalidConfig(input: JsonValue): void {
  expect(() => parseFunnelConfig(input)).toThrow();
}

describe("funnel config contract", () => {
  test("initial and alternative fixtures parse", () => {
    expect(parseFunnelConfig(initialConfig).id).toBe("wellness-quiz-v1");
    expect(parseFunnelConfig(alternativeConfig).id).toBe("wellness-quiz-alt");
  });

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

  test("iteration-2 B has exact 5 steps without tail", () => {
    const config = parseFunnelConfig(iteration2Config);
    const variantB = resolveEffectiveConfig(config, "B");
    expect(variantB.steps.map((step) => step.id)).toEqual([
      "goal",
      "timeline",
      "habits",
      "budget",
      "summary",
    ]);
    expect(variantB.steps.length).toBe(5);
  });
});
