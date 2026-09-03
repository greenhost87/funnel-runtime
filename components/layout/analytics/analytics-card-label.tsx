import type { LayoutDivProps } from "@/components/layout/html-props";

export function AnalyticsCardLabel({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-card__label" {...props}>
      {children}
    </div>
  );
}
