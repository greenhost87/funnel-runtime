"use client";

type FunnelControlsProps = {
  showBack: boolean;
  showNext: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
};

export function FunnelControls({
  showBack,
  showNext,
  nextLabel = "Next",
  onBack,
  onNext,
  nextDisabled,
}: FunnelControlsProps) {
  return (
    <div className="funnel__controls">
      {showBack ? (
        <button className="btn btn--secondary" type="button" onClick={onBack}>
          Back
        </button>
      ) : null}
      {showNext ? (
        <button className="btn btn--primary" type="button" onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </button>
      ) : null}
    </div>
  );
}
