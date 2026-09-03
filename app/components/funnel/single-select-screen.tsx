"use client";

import type { SingleSelectStep } from "@/system/funnel/config.types";

type Props = {
  step: SingleSelectStep;
  value: string | null;
  onChange: (value: string) => void;
};

export function SingleSelectScreen({ step, value, onChange }: Props) {
  return (
    <div className="funnel__options" role="radiogroup" aria-label={step.title}>
      {step.options.map((option) => (
        <label
          key={option.id}
          className={`funnel__option${value === option.id ? " funnel__option--selected" : ""}`}
        >
          <input
            type="radio"
            name={step.id}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
