"use client";

type FunnelProgressProps = {
  current: number;
  total: number;
  percent: number;
};

export function FunnelProgress({ current, total, percent }: FunnelProgressProps) {
  return (
    <div className="funnel__progress">
      <div className="funnel__progress-bar" aria-hidden="true">
        <div className="funnel__progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="funnel__progress-label">
        Step {current} of {total}
      </p>
    </div>
  );
}
