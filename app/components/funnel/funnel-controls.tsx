"use client";

import { SecondaryActionButton } from "@/components/ui/secondary-action-button";
import { Button } from "@/components/ui/button";
import { FunnelControls as FunnelControlsRoot } from "@/components/layout/funnel/funnel-controls";

type FunnelControlsProps = {
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
}: FunnelControlsProps) {
  return (
    <FunnelControlsRoot>
      {showBack ? (
        <SecondaryActionButton onClick={onBack}>
          Back
        </SecondaryActionButton>
      ) : null}
      <Button variant="primary" type="button" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </FunnelControlsRoot>
  );
}
