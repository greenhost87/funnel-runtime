"use client";

import {
  FunnelProgress as FunnelProgressRoot,
  FunnelProgressBar,
  FunnelProgressFill,
  FunnelProgressLabel,
} from "@/components/layout/funnel-primitives";

type FunnelProgressProps = {
  current: number;
  total: number;
  percent: number;
};

export function FunnelStepProgress({ current, total, percent }: FunnelProgressProps) {
  return (
    <FunnelProgressRoot>
      <FunnelProgressBar aria-hidden>
        <FunnelProgressFill percent={percent} />
      </FunnelProgressBar>
      <FunnelProgressLabel>
        Step {current} of {total}
      </FunnelProgressLabel>
    </FunnelProgressRoot>
  );
}
