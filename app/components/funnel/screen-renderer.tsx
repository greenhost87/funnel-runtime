"use client";

import { FunnelConfigError } from "@/components/layout/class-tagged";
import type { FunnelStep, StepAnswer } from "@/system/funnel/config.types";
import { InfoScreen } from "@/app/components/funnel/info-screen";
import { MultiSelectScreen } from "@/app/components/funnel/multi-select-screen";
import { NumberScreen } from "@/app/components/funnel/number-screen";
import { SingleSelectScreen } from "@/app/components/funnel/single-select-screen";
import * as v from "valibot";

const DraftStringSchema = v.string();
const DraftStringArraySchema = v.array(v.string());

type Props = {
  step: FunnelStep;
  draftAnswer: StepAnswer | null;
  onDraftChange: (value: StepAnswer | null) => void;
};

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

export function ScreenRenderer({ step, draftAnswer, onDraftChange }: Props) {
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
        <NumberScreen
          step={step}
          value={formatDraftNumber(draftAnswer)}
          onChange={onDraftChange}
        />
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
