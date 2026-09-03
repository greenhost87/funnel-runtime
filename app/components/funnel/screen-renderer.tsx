"use client";

import type { FunnelStep } from "@/system/funnel/config.types";
import { InfoScreen } from "@/app/components/funnel/info-screen";
import { MultiSelectScreen } from "@/app/components/funnel/multi-select-screen";
import { NumberScreen } from "@/app/components/funnel/number-screen";
import { SingleSelectScreen } from "@/app/components/funnel/single-select-screen";

type Props = {
  step: FunnelStep;
  draftAnswer: unknown;
  onDraftChange: (value: unknown) => void;
};

export function ScreenRenderer({ step, draftAnswer, onDraftChange }: Props) {
  switch (step.type) {
    case "single-select":
      return (
        <SingleSelectScreen
          step={step}
          value={typeof draftAnswer === "string" ? draftAnswer : null}
          onChange={onDraftChange}
        />
      );
    case "multi-select":
      return (
        <MultiSelectScreen
          step={step}
          value={Array.isArray(draftAnswer) ? (draftAnswer as string[]) : []}
          onChange={onDraftChange}
        />
      );
    case "number":
      return (
        <NumberScreen
          step={step}
          value={typeof draftAnswer === "string" ? draftAnswer : (draftAnswer?.toString() ?? "")}
          onChange={onDraftChange}
        />
      );
    case "info":
      return <InfoScreen step={step} />;
    default: {
      const unknownStep = step as { type?: string };
      return (
        <div className="funnel__config-error" role="alert">
          Unsupported step type: {unknownStep.type ?? "unknown"}
        </div>
      );
    }
  }
}
