import type { LayoutDivProps } from "@/components/layout/html-props";

export function AnalyticsCardValue({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-card__value" {...props}>
      {children}
    </div>
  );
}
