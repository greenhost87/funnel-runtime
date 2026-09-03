"use client";

import type { InfoStep } from "@/system/funnel/config.types";

type Props = {
  step: InfoStep;
};

export function InfoScreen({ step }: Props) {
  return (
    <div className="funnel__header">
      {step.description ? <p className="funnel__description">{step.description}</p> : null}
    </div>
  );
}
