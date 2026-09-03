import type { LayoutDivProps } from "@/components/layout/html-props";

export function AnalyticsGrid({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-grid" {...props}>
      {children}
    </div>
  );
}
