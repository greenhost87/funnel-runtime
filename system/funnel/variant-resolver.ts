import type {
  AnswerCondition,
  EffectiveFunnelConfig,
  FunnelConfig,
  FunnelStep,
  FunnelVariant,
  ResultConfig,
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

  const ordered = override.stepOrder.filter((id) => !excluded.has(id));
  for (const id of baseOrder) {
    if (!ordered.includes(id)) {
      ordered.push(id);
    }
  }
  return ordered;
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

function validateEffectiveTransitions(steps: FunnelStep[]): void {
  const stepIds = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    for (const transition of step.transitions) {
      if (transition.target.type === "step" && !stepIds.has(transition.target.stepId)) {
        throw new Error(
          `Variant override leaves broken transition from ${step.id} to ${transition.target.stepId}`,
        );
      }
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
  answer: string | string[] | number | null | undefined,
): boolean {
  if (answer === null || answer === undefined) {
    return false;
  }

  switch (condition.op) {
    case "equals":
      return answer === condition.value;
    case "in":
      return typeof answer === "string" && condition.values.includes(answer);
    case "gte":
      return typeof answer === "number" && answer >= condition.value;
    case "lte":
      return typeof answer === "number" && answer <= condition.value;
    default:
      return false;
  }
}
