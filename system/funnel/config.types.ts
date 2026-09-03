export type FunnelVariant = "A" | "B";

export type StepType = "single-select" | "multi-select" | "number" | "info";

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

type StepBase = {
  id: string;
  title: string;
  description?: string;
  transitions: StepTransition[];
};

export type SingleSelectStep = StepBase & {
  type: "single-select";
  options: Array<{ id: string; label: string }>;
  required?: boolean;
};

export type MultiSelectStep = StepBase & {
  type: "multi-select";
  options: Array<{ id: string; label: string }>;
  minSelections?: number;
  maxSelections?: number;
  required?: boolean;
};

export type NumberStep = StepBase & {
  type: "number";
  min?: number;
  max?: number;
  required?: boolean;
  unit?: string;
};

export type InfoStep = StepBase & {
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

export type VariantOverride = {
  stepOrder?: string[];
  excludedStepIds?: string[];
  stepTextOverrides?: Record<string, { title?: string; description?: string }>;
  result?: Partial<Omit<ResultConfig, "cta">> & {
    cta?: Partial<ResultConfig["cta"]>;
  };
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
