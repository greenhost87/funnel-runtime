import type { LayoutDivProps } from "@/components/layout/html-props";

export function FunnelProgress({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__progress" {...props}>
      {children}
    </div>
  );
}
