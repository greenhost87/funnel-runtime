import type { LayoutDivProps } from "@/components/layout/html-props";

export function FunnelProgressBar({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__progress-bar" {...props}>
      {children}
    </div>
  );
}
