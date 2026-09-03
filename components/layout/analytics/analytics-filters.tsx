import type { LayoutDivProps } from "@/components/layout/html-props";

export function AnalyticsFilters({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-filters" {...props}>
      {children}
    </div>
  );
}
