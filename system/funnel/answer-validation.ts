import type { AnswerValue, FunnelAnswers, FunnelStep } from "./config.types";

export type ValidationResult =
  | { valid: true; value: AnswerValue }
  | { valid: false; error: string };

export function validateAnswer(step: FunnelStep, raw: unknown): ValidationResult {
  switch (step.type) {
    case "single-select":
      return validateSingleSelect(step, raw);
    case "multi-select":
      return validateMultiSelect(step, raw);
    case "number":
      return validateNumber(step, raw);
    case "info":
      return { valid: false, error: "Info steps do not accept answers" };
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

function validateSingleSelect(
  step: Extract<FunnelStep, { type: "single-select" }>,
  raw: unknown,
): ValidationResult {
  if (typeof raw !== "string") {
    return { valid: false, error: "Answer must be a string option id" };
  }
  const option = step.options.find((item) => item.id === raw);
  if (!option) {
    return { valid: false, error: "Unknown option selected" };
  }
  if (step.required !== false && raw.length === 0) {
    return { valid: false, error: "Selection is required" };
  }
  return { valid: true, value: raw };
}

function validateMultiSelect(
  step: Extract<FunnelStep, { type: "multi-select" }>,
  raw: unknown,
): ValidationResult {
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === "string")) {
    return { valid: false, error: "Answer must be an array of option ids" };
  }
  const unique = [...new Set(raw)];
  for (const id of unique) {
    if (!step.options.some((option) => option.id === id)) {
      return { valid: false, error: `Unknown option selected: ${id}` };
    }
  }
  const min = step.minSelections ?? (step.required === false ? 0 : 1);
  const max = step.maxSelections ?? step.options.length;
  if (unique.length < min) {
    return { valid: false, error: `Select at least ${min} option(s)` };
  }
  if (unique.length > max) {
    return { valid: false, error: `Select at most ${max} option(s)` };
  }
  return { valid: true, value: unique };
}

function validateNumber(
  step: Extract<FunnelStep, { type: "number" }>,
  raw: unknown,
): ValidationResult {
  const value = typeof raw === "string" ? Number(raw) : raw;
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { valid: false, error: "Answer must be a number" };
  }
  if (step.min !== undefined && value < step.min) {
    return { valid: false, error: `Value must be at least ${step.min}` };
  }
  if (step.max !== undefined && value > step.max) {
    return { valid: false, error: `Value must be at most ${step.max}` };
  }
  if (step.required !== false && raw === null) {
    return { valid: false, error: "Number is required" };
  }
  return { valid: true, value };
}

export function getStoredAnswer(answers: FunnelAnswers, stepId: string): AnswerValue | undefined {
  const value = answers[stepId];
  if (value === null || value === undefined) {
    return undefined;
  }
  return value;
}
