export const FUNNEL_VARIANTS = ["A", "B"] as const;
export type FunnelVariant = (typeof FUNNEL_VARIANTS)[number];

export const STEP_TYPES = ["single-select", "multi-select", "number", "info"] as const;

export type TransitionTarget = { type: "step"; stepId: string } | { type: "result" };

export type AnswerCondition =
  | { op: "equals"; value: string | number }
  | { op: "in"; values: string[] }
  | { op: "gte"; value: number }
  | { op: "lte"; value: number };

export type StepTransition = {
  id: string;
  when?: AnswerCondition;
  target: TransitionTarget;
};

export type SingleSelectStep = {
  id: string;
  title: string;
  description?: string;
  transitions: StepTransition[];
  type: "single-select";
  options: Array<{ id: string; label: string }>;
  required?: boolean;
};

export type MultiSelectStep = {
  id: string;
  title: string;
  description?: string;
  transitions: StepTransition[];
  type: "multi-select";
  options: Array<{ id: string; label: string }>;
  minSelections?: number;
  maxSelections?: number;
  required?: boolean;
};

export type NumberStep = {
  id: string;
  title: string;
  description?: string;
  transitions: StepTransition[];
  type: "number";
  min?: number;
  max?: number;
  required?: boolean;
  unit?: string;
};

export type InfoStep = {
  id: string;
  title: string;
  description?: string;
  transitions: StepTransition[];
  type: "info";
};

export type FunnelStep = SingleSelectStep | MultiSelectStep | NumberStep | InfoStep;

export type ResultConfig = {
  title: string;
  body: string;
  cta: {
    label: string;
    url: string;
  };
};

export type ResultOverride = {
  title?: string;
  body?: string;
  cta?: {
    label?: string;
    url?: string;
  };
};

export type VariantOverride = {
  stepOrder?: string[];
  excludedStepIds?: string[];
  stepTextOverrides?: Record<string, { title?: string; description?: string }>;
  result?: ResultOverride;
};

export type FunnelConfig = {
  id: string;
  name: string;
  steps: FunnelStep[];
  result: ResultConfig;
  variants: Record<FunnelVariant, VariantOverride>;
  customEvents?: string[];
};

export type StepAnswer = string | string[] | number | null;

export type FunnelAnswers = Record<string, StepAnswer>;

export type EffectiveFunnelConfig = {
  id: string;
  name: string;
  steps: FunnelStep[];
  result: ResultConfig;
  customEvents: string[];
  variant: FunnelVariant;
};

export type FunnelSessionState = {
  currentStepId: string | null;
  isResult: boolean;
  answers: FunnelAnswers;
  history: string[];
  progress: {
    current: number;
    total: number;
    percent: number;
  };
};

export type AnswerValue = string | string[] | number;
