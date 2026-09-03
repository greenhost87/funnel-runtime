"use client";

import { FunnelDescription } from "@/components/layout/class-tagged";
import { FunnelHeader } from "@/components/layout/funnel/funnel-header";
import type { InfoStep } from "@/system/funnel/config.types";

type Props = {
  step: InfoStep;
};

export function InfoScreen({ step }: Props) {
  return (
    <FunnelHeader>
      {step.description ? <FunnelDescription>{step.description}</FunnelDescription> : null}
    </FunnelHeader>
  );
}
