import type { LayoutDivProps } from "@/components/layout/html-props";

export function AnalyticsTableWrap({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-table-wrap" {...props}>
      {children}
    </div>
  );
}
