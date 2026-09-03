"use client";

import { Button } from "@/components/ui/button";
import { FunnelControlSpacer } from "@/components/layout/funnel/funnel-control-spacer";
import { FunnelControls as FunnelControlsRoot } from "@/components/layout/funnel/funnel-controls";

type FunnelScreenControlsProps = {
  showBack: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
};

export function FunnelScreenControls({
  showBack,
  nextLabel = "Next",
  onBack,
  onNext,
  nextDisabled,
}: FunnelScreenControlsProps) {
  return (
    <FunnelControlsRoot>
      {showBack ? (
        <Button variant="secondary" type="button" className="funnel__control-button" onClick={onBack}>
          Back
        </Button>
      ) : (
        <FunnelControlSpacer />
      )}
      <Button
        variant="primary"
        type="button"
        className="funnel__control-button"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </Button>
    </FunnelControlsRoot>
  );
}
