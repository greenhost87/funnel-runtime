import { describe, expect, test } from "bun:test";
import initialConfig from "@/fixtures/funnels/initial.json";
import alternativeConfig from "@/fixtures/funnels/alternative.json";
import { parseFunnelConfig, safeParseFunnelConfig } from "@/system/funnel/config.schema";
import { resolveEffectiveConfig } from "@/system/funnel/variant-resolver";

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
    expect(safeParseFunnelConfig(broken).success).toBe(false);
  });

  test("rejects variant with broken excluded step reference", () => {
    const broken = {
      ...initialConfig,
      variants: {
        ...initialConfig.variants,
        B: { excludedStepIds: ["does-not-exist"] },
      },
    };
    expect(safeParseFunnelConfig(broken).success).toBe(false);
  });
});
