"use client";

import { Button } from "@/components/ui/button";
import type {
  FunnelProgressFillProps,
  LayoutDivProps,
  LayoutHeadingProps,
  LayoutParagraphProps,
} from "@/components/layout/html-props";

export function Funnel({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel" {...props}>
      {children}
    </div>
  );
}

export function FunnelHeader({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__header" {...props}>
      {children}
    </div>
  );
}

export function FunnelTitle({ children, ...props }: LayoutHeadingProps) {
  return (
    <h1 className="title is-3 funnel__title" {...props}>
      {children}
    </h1>
  );
}

export function FunnelLoading({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__loading" {...props}>
      {children}
    </p>
  );
}

export function FunnelOptions({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__options" {...props}>
      {children}
    </div>
  );
}

export function FunnelProgress({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__progress" {...props}>
      {children}
    </div>
  );
}

export function FunnelProgressBar({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__progress-bar" {...props}>
      {children}
    </div>
  );
}

export function FunnelProgressFill({ percent, ...props }: FunnelProgressFillProps) {
  return <div {...props} className="funnel__progress-fill" style={{ width: `${percent}%` }} />;
}

export function FunnelProgressLabel({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__progress-label" {...props}>
      {children}
    </p>
  );
}

function FunnelControls({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__controls" {...props}>
      {children}
    </div>
  );
}

function FunnelControlSpacer() {
  return <span className="funnel__control-spacer" aria-hidden="true" />;
}

export function FunnelResult({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__result" {...props}>
      {children}
    </div>
  );
}

export function FunnelResultTitle({ children, ...props }: LayoutHeadingProps) {
  return (
    <h2 className="title is-4 funnel__result-title" {...props}>
      {children}
    </h2>
  );
}

export function FunnelResultBody({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__result-body" {...props}>
      {children}
    </p>
  );
}

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
    <FunnelControls>
      {showBack ? (
        <Button
          variant="secondary"
          type="button"
          className="funnel__control-button"
          onClick={onBack}
        >
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
    </FunnelControls>
  );
}
