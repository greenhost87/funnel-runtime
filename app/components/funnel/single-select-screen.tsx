"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FunnelOptions } from "@/components/layout/funnel/funnel-options";
import type { SingleSelectStep } from "@/system/funnel/config.types";

type Props = {
  step: SingleSelectStep;
  value: string | null;
  onChange: (value: string) => void;
};

export function SingleSelectScreen({ step, value, onChange }: Props) {
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
