import * as v from "valibot";
import {
  FUNNEL_VARIANTS,
  STEP_TYPES,
  type FunnelConfig,
  type FunnelStep,
  type FunnelVariant,
} from "./config.types";
import type { JsonValue } from "@/system/http/json";
import { resolveEffectiveConfig } from "./variant-resolver";

const TransitionTargetSchema = v.union([
  v.object({ type: v.literal("step"), stepId: v.string() }),
  v.object({ type: v.literal("result") }),
]);

const AnswerConditionSchema = v.union([
  v.object({ op: v.literal("equals"), value: v.union([v.string(), v.number()]) }),
  v.object({ op: v.literal("in"), values: v.array(v.string()) }),
  v.object({ op: v.literal("gte"), value: v.number() }),
  v.object({ op: v.literal("lte"), value: v.number() }),
]);

const StepTransitionSchema = v.object({
  id: v.string(),
  when: v.optional(AnswerConditionSchema),
  target: TransitionTargetSchema,
});

const StepBaseFields = {
  id: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  transitions: v.array(StepTransitionSchema),
};

const SingleSelectStepSchema = v.object({
  ...StepBaseFields,
  type: v.literal("single-select"),
  options: v.array(v.object({ id: v.string(), label: v.string() })),
  required: v.optional(v.boolean()),
});

const MultiSelectStepSchema = v.object({
  ...StepBaseFields,
  type: v.literal("multi-select"),
  options: v.array(v.object({ id: v.string(), label: v.string() })),
  minSelections: v.optional(v.number()),
  maxSelections: v.optional(v.number()),
  required: v.optional(v.boolean()),
});

const NumberStepSchema = v.object({
  ...StepBaseFields,
  type: v.literal("number"),
  min: v.optional(v.number()),
  max: v.optional(v.number()),
  required: v.optional(v.boolean()),
  unit: v.optional(v.string()),
});

const InfoStepSchema = v.object({
  ...StepBaseFields,
  type: v.literal("info"),
});

export const FunnelStepSchema = v.union([
  SingleSelectStepSchema,
  MultiSelectStepSchema,
  NumberStepSchema,
  InfoStepSchema,
]);

export const ResultConfigSchema = v.object({
  title: v.string(),
  body: v.string(),
  cta: v.object({
    label: v.string(),
    url: v.string(),
  }),
});

export const StepAnswerSchema = v.union([v.string(), v.array(v.string()), v.number(), v.null()]);

export const FunnelAnswersSchema = v.record(v.string(), StepAnswerSchema);

const VariantOverrideSchema = v.object({
  stepOrder: v.optional(v.array(v.string())),
  excludedStepIds: v.optional(v.array(v.string())),
  stepTextOverrides: v.optional(
    v.record(
      v.string(),
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  ),
  result: v.optional(
    v.object({
      title: v.optional(v.string()),
      body: v.optional(v.string()),
      cta: v.optional(
        v.object({
          label: v.optional(v.string()),
          url: v.optional(v.string()),
        }),
      ),
    }),
  ),
});

export const FunnelConfigSchema = v.object({
  id: v.string(),
  name: v.string(),
  steps: v.pipe(v.array(FunnelStepSchema), v.minLength(6)),
  result: ResultConfigSchema,
  variants: v.object({
    A: VariantOverrideSchema,
    B: VariantOverrideSchema,
  }),
  customEvents: v.optional(v.array(v.string())),
});

function collectIds(steps: FunnelStep[]): Set<string> {
  return new Set(steps.map((step) => step.id));
}

function validateStepTransitions(config: FunnelConfig, stepIds: Set<string>): string[] {
  const errors: string[] = [];
  const transitionIds = new Set<string>();

  for (const step of config.steps) {
    for (const transition of step.transitions) {
      if (transitionIds.has(transition.id)) {
        errors.push(`Duplicate transition id: ${transition.id}`);
      }
      transitionIds.add(transition.id);

      if (transition.target.type === "step" && !stepIds.has(transition.target.stepId)) {
        errors.push(`Step ${step.id} references unknown step ${transition.target.stepId}`);
      }
    }
  }

  return errors;
}

function validateVariantStepReferences(
  variant: FunnelVariant,
  stepIds: Set<string>,
  stepId: string,
  label: string,
): string | null {
  if (!stepIds.has(stepId)) {
    return `Variant ${variant} ${label} references unknown step ${stepId}`;
  }
  return null;
}

function validateVariantStepList(
  variant: FunnelVariant,
  stepIds: Set<string>,
  stepIdsToCheck: string[],
  label: string,
): string[] {
  const errors: string[] = [];
  for (const stepId of stepIdsToCheck) {
    const error = validateVariantStepReferences(variant, stepIds, stepId, label);
    if (error) {
      errors.push(error);
    }
  }
  return errors;
}

function validateVariantOverrides(config: FunnelConfig, stepIds: Set<string>): string[] {
  const errors: string[] = [];

  for (const variant of FUNNEL_VARIANTS) {
    const override = config.variants[variant];
    if (override.stepOrder) {
      errors.push(...validateVariantStepList(variant, stepIds, override.stepOrder, "stepOrder"));
    }
    if (override.excludedStepIds) {
      errors.push(
        ...validateVariantStepList(variant, stepIds, override.excludedStepIds, "excludedStepIds"),
      );
    }
    errors.push(
      ...validateVariantStepList(
        variant,
        stepIds,
        Object.keys(override.stepTextOverrides ?? {}),
        "text override",
      ),
    );
  }

  return errors;
}

function validateTransitionReferences(config: FunnelConfig): string[] {
  const stepIds = collectIds(config.steps);
  return [
    ...validateStepTransitions(config, stepIds),
    ...validateVariantOverrides(config, stepIds),
  ];
}

function hasBranching(config: FunnelConfig): boolean {
  return config.steps.some((step) => step.transitions.filter((t) => t.when).length > 0);
}

export function parseFunnelConfig(input: JsonValue): FunnelConfig {
  const parsed = v.parse(FunnelConfigSchema, input);
  const refErrors = validateTransitionReferences(parsed);
  if (refErrors.length > 0) {
    throw new Error(refErrors.join("; "));
  }
  if (!hasBranching(parsed)) {
    throw new Error("Config must include at least one conditional transition");
  }
  const stepIds = collectIds(parsed.steps);
  if (stepIds.size !== parsed.steps.length) {
    throw new Error("Step ids must be unique");
  }
  for (const step of parsed.steps) {
    if (!STEP_TYPES.includes(step.type)) {
      throw new Error(`Unknown step type: ${step.type}`);
    }
  }
  for (const variant of FUNNEL_VARIANTS) {
    try {
      resolveEffectiveConfig(parsed, variant);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Variant ${variant} effective config invalid: ${message}`, { cause: error });
    }
  }
  return parsed;
}
