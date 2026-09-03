"use client";

import { Input } from "@/components/ui/input";
import { FormField } from "@/components/layout/form-field";
import { FunnelDescription } from "@/components/layout/class-tagged";
import type { NumberStep } from "@/system/funnel/config.types";

type Props = {
  step: NumberStep;
  value: string;
  onChange: (value: string) => void;
};

export function NumberScreen({ step, value, onChange }: Props) {
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
