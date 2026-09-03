"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FunnelConfigError, FunnelDescription } from "@/components/layout/class-tagged";
import { FormField } from "@/components/layout/primitives";
import {
  FunnelHeader,
  FunnelOptions,
  FunnelResult,
  FunnelResultBody,
  FunnelResultTitle,
} from "@/components/layout/funnel-primitives";
import type {
  FunnelStep,
  InfoStep,
  MultiSelectStep,
  NumberStep,
  ResultConfig,
  SingleSelectStep,
  StepAnswer,
} from "@/system/funnel/config.types";
import * as v from "valibot";

function InfoScreen({ step }: { step: InfoStep }) {
  return (
    <FunnelHeader>
      {step.description ? <FunnelDescription>{step.description}</FunnelDescription> : null}
    </FunnelHeader>
  );
}

function SingleSelectScreen({
  step,
  value,
  onChange,
}: {
  step: SingleSelectStep;
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <FunnelOptions role="radiogroup" aria-label={step.title}>
      {step.options.map((option) => (
        <Label key={option.id} variant="option" selected={value === option.id}>
          <Input
            type="radio"
            name={step.id}
            value={option.id}
            checked={value === option.id}
            onChange={() => {
              onChange(option.id);
            }}
          />
          <span>{option.label}</span>
        </Label>
      ))}
    </FunnelOptions>
  );
}

function MultiSelectScreen({
  step,
  value,
  onChange,
}: {
  step: MultiSelectStep;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(optionId: string) {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId));
      return;
    }
    onChange([...value, optionId]);
  }

  return (
    <FunnelOptions role="group" aria-label={step.title}>
      {step.options.map((option) => (
        <Label key={option.id} variant="option" selected={value.includes(option.id)}>
          <Input
            type="checkbox"
            value={option.id}
            checked={value.includes(option.id)}
            onChange={() => {
              toggle(option.id);
            }}
          />
          <span>{option.label}</span>
        </Label>
      ))}
    </FunnelOptions>
  );
}

function NumberScreen({
  step,
  value,
  onChange,
}: {
  step: NumberStep;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField>
      <Input
        variant="form"
        type="number"
        min={step.min}
        max={step.max}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        aria-label={step.title}
      />
      {step.unit ? <FunnelDescription as="span">{step.unit}</FunnelDescription> : null}
    </FormField>
  );
}

export function ResultScreen({
  result,
  onCtaClick,
}: {
  result: ResultConfig;
  onCtaClick: () => void;
}) {
  return (
    <FunnelResult>
      <FunnelResultTitle>{result.title}</FunnelResultTitle>
      <FunnelResultBody>{result.body}</FunnelResultBody>
      <Button variant="primary" cta type="button" onClick={onCtaClick}>
        {result.cta.label}
      </Button>
    </FunnelResult>
  );
}

const DraftStringSchema = v.string();
const DraftStringArraySchema = v.array(v.string());

function parseStringDraft(draftAnswer: StepAnswer | null): string | null {
  const parsed = v.safeParse(DraftStringSchema, draftAnswer);
  return parsed.success ? parsed.output : null;
}

function parseStringArrayDraft(draftAnswer: StepAnswer | null): string[] {
  const parsed = v.safeParse(DraftStringArraySchema, draftAnswer);
  return parsed.success ? parsed.output : [];
}

function formatDraftNumber(draftAnswer: StepAnswer | null): string {
  if (typeof draftAnswer === "string") {
    return draftAnswer;
  }
  if (typeof draftAnswer === "number") {
    return String(draftAnswer);
  }
  return "";
}

type ScreenRendererProps = {
  step: FunnelStep;
  draftAnswer: StepAnswer | null;
  onDraftChange: (value: StepAnswer | null) => void;
};

export function ScreenRenderer({ step, draftAnswer, onDraftChange }: ScreenRendererProps) {
  switch (step.type) {
    case "single-select":
      return (
        <SingleSelectScreen
          step={step}
          value={parseStringDraft(draftAnswer)}
          onChange={onDraftChange}
        />
      );
    case "multi-select":
      return (
        <MultiSelectScreen
          step={step}
          value={parseStringArrayDraft(draftAnswer)}
          onChange={onDraftChange}
        />
      );
    case "number":
      return (
        <NumberScreen step={step} value={formatDraftNumber(draftAnswer)} onChange={onDraftChange} />
      );
    case "info":
      return <InfoScreen step={step} />;
    default:
      return (
        <FunnelConfigError as="div" role="alert">
          Unsupported step type
        </FunnelConfigError>
      );
  }
}
