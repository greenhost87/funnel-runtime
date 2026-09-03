import * as v from "valibot";
import type { FunnelConfig, FunnelStep, FunnelVariant } from "./config.types";

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

const FunnelStepSchema = v.union([
  SingleSelectStepSchema,
  MultiSelectStepSchema,
  NumberStepSchema,
  InfoStepSchema,
]);

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
  result: v.object({
    title: v.string(),
    body: v.string(),
    cta: v.object({
      label: v.string(),
      url: v.string(),
    }),
  }),
  variants: v.object({
    A: VariantOverrideSchema,
    B: VariantOverrideSchema,
  }),
  customEvents: v.optional(v.array(v.string())),
});

function collectIds(steps: FunnelStep[]): Set<string> {
  return new Set(steps.map((step) => step.id));
}

function validateTransitionReferences(config: FunnelConfig): string[] {
  const errors: string[] = [];
  const stepIds = collectIds(config.steps);
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

  for (const variant of ["A", "B"] as FunnelVariant[]) {
    const override = config.variants[variant];
    if (override.stepOrder) {
      for (const stepId of override.stepOrder) {
        if (!stepIds.has(stepId)) {
          errors.push(`Variant ${variant} stepOrder references unknown step ${stepId}`);
        }
      }
    }
    if (override.excludedStepIds) {
      for (const stepId of override.excludedStepIds) {
        if (!stepIds.has(stepId)) {
          errors.push(`Variant ${variant} excludedStepIds references unknown step ${stepId}`);
        }
      }
    }
    for (const stepId of Object.keys(override.stepTextOverrides ?? {})) {
      if (!stepIds.has(stepId)) {
        errors.push(`Variant ${variant} text override references unknown step ${stepId}`);
      }
    }
  }

  return errors;
}

function hasBranching(config: FunnelConfig): boolean {
  return config.steps.some((step) => step.transitions.filter((t) => t.when).length > 0);
}

export function parseFunnelConfig(input: unknown): FunnelConfig {
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
  return parsed;
}

export function safeParseFunnelConfig(input: unknown):
  | {
      success: true;
      data: FunnelConfig;
    }
  | {
      success: false;
      errors: string[];
    } {
  const schemaResult = v.safeParse(FunnelConfigSchema, input);
  if (!schemaResult.success) {
    return {
      success: false,
      errors: schemaResult.issues.map((issue) => issue.message),
    };
  }

  try {
    const data = parseFunnelConfig(schemaResult.output);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
