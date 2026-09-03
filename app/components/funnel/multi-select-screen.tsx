"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FunnelOptions } from "@/components/layout/funnel/funnel-options";
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
