"use client";

import type { NumberStep } from "@/system/funnel/config.types";

type Props = {
  step: NumberStep;
  value: string;
  onChange: (value: string) => void;
};

export function NumberScreen({ step, value, onChange }: Props) {
  return (
    <div className="form-field">
      <input
        className="form-input"
        type="number"
        min={step.min}
        max={step.max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={step.title}
      />
      {step.unit ? <span className="funnel__description">{step.unit}</span> : null}
    </div>
  );
}
