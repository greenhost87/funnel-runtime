"use client";

import { FunnelProgress as FunnelProgressRoot } from "@/components/layout/funnel/funnel-progress";
import { FunnelProgressBar } from "@/components/layout/funnel/funnel-progress-bar";
import { FunnelProgressFill } from "@/components/layout/funnel/funnel-progress-fill";
import { FunnelProgressLabel } from "@/components/layout/funnel/funnel-progress-label";

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
