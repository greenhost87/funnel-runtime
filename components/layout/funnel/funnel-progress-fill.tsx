import type { FunnelProgressFillProps } from "@/components/layout/html-props";

export function FunnelProgressFill({ percent, ...props }: FunnelProgressFillProps) {
  return (
    <div {...props} className="funnel__progress-fill" style={{ width: `${percent}%` }} />
  );
}
