import * as v from "valibot";
import type {
  AnswerCondition,
  AnswerValue,
  EffectiveFunnelConfig,
  FunnelConfig,
  FunnelStep,
  FunnelVariant,
  ResultConfig,
  TransitionTarget,
} from "./config.types";

function applyTextOverrides(
  step: FunnelStep,
  overrides: Record<string, { title?: string; description?: string }> | undefined,
): FunnelStep {
  const override = overrides?.[step.id];
  if (!override) {
    return step;
  }
  return {
    ...step,
    title: override.title ?? step.title,
    description: override.description ?? step.description,
  };
}

function resolveStepOrder(config: FunnelConfig, variant: FunnelVariant): string[] {
  const override = config.variants[variant];
  const excluded = new Set(override.excludedStepIds ?? []);
  const baseOrder = config.steps.map((step) => step.id).filter((id) => !excluded.has(id));

  if (!override.stepOrder) {
    return baseOrder;
  }

  return override.stepOrder.filter((id) => !excluded.has(id));
}

function buildEffectiveSteps(config: FunnelConfig, variant: FunnelVariant): FunnelStep[] {
  const stepMap = new Map(config.steps.map((step) => [step.id, step]));
  const order = resolveStepOrder(config, variant);
  const textOverrides = config.variants[variant].stepTextOverrides;

  return order
    .map((id) => stepMap.get(id))
    .filter((step): step is FunnelStep => step !== undefined)
    .map((step) => applyTextOverrides(step, textOverrides));
}

function buildEffectiveResult(config: FunnelConfig, variant: FunnelVariant): ResultConfig {
  const override = config.variants[variant].result ?? {};
  return {
    title: override.title ?? config.result.title,
    body: override.body ?? config.result.body,
    cta: {
      label: override.cta?.label ?? config.result.cta.label,
      url: override.cta?.url ?? config.result.cta.url,
    },
  };
}

function isTransitionTargetValid(target: TransitionTarget, stepIds: Set<string>): boolean {
  return target.type === "result" || stepIds.has(target.stepId);
}

function validateEffectiveTransitions(steps: FunnelStep[]): void {
  const stepIds = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    const defaultTransitions = step.transitions.filter((transition) => !transition.when);
    if (defaultTransitions.length > 0) {
      const hasValidDefault = defaultTransitions.some((transition) =>
        isTransitionTargetValid(transition.target, stepIds),
      );
      if (!hasValidDefault) {
        const broken = defaultTransitions.find(
          (transition) =>
            transition.target.type === "step" && !stepIds.has(transition.target.stepId),
        );
        if (broken?.target.type === "step") {
          throw new Error(
            `Variant override leaves broken transition from ${step.id} to ${broken.target.stepId}`,
          );
        }
        throw new Error(`Variant override leaves step ${step.id} with no valid default transition`);
      }
      continue;
    }
    const hasValid = step.transitions.some((transition) =>
      isTransitionTargetValid(transition.target, stepIds),
    );
    if (!hasValid) {
      throw new Error(`Variant override leaves step ${step.id} with no valid transitions`);
    }
  }
}

export function resolveEffectiveConfig(
  config: FunnelConfig,
  variant: FunnelVariant,
): EffectiveFunnelConfig {
  const steps = buildEffectiveSteps(config, variant);
  validateEffectiveTransitions(steps);

  return {
    id: config.id,
    name: config.name,
    steps,
    result: buildEffectiveResult(config, variant),
    customEvents: config.customEvents ?? [],
    variant,
  };
}

export function getStepById(config: EffectiveFunnelConfig, stepId: string): FunnelStep | undefined {
  return config.steps.find((step) => step.id === stepId);
}

export function matchesCondition(
  condition: AnswerCondition,
  answer: AnswerValue | undefined,
): boolean {
  if (answer === undefined) {
    return false;
  }

  switch (condition.op) {
    case "equals":
      return answer === condition.value;
    case "in": {
      if (typeof answer === "string") {
        return condition.values.includes(answer);
      }
      const parsed = v.safeParse(v.array(v.string()), answer);
      if (parsed.success) {
        return parsed.output.some((value) => condition.values.includes(value));
      }
      return false;
    }
    case "gte":
      return typeof answer === "number" && answer >= condition.value;
    case "lte":
      return typeof answer === "number" && answer <= condition.value;
    default:
      return false;
  }
}
