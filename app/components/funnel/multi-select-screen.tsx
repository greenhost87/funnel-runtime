"use client";

import type { MultiSelectStep } from "@/system/funnel/config.types";

type Props = {
  step: MultiSelectStep;
  value: string[];
  onChange: (value: string[]) => void;
};

export function MultiSelectScreen({ step, value, onChange }: Props) {
  function toggle(optionId: string) {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId));
      return;
    }
    onChange([...value, optionId]);
  }

  return (
    <div className="funnel__options" role="group" aria-label={step.title}>
      {step.options.map((option) => (
        <label
          key={option.id}
          className={`funnel__option${value.includes(option.id) ? " funnel__option--selected" : ""}`}
        >
          <input
            type="checkbox"
            value={option.id}
            checked={value.includes(option.id)}
            onChange={() => toggle(option.id)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
