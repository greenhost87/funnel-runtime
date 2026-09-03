import type { LayoutTableProps } from "@/components/layout/html-props";

export function AnalyticsTable({ children, ...props }: LayoutTableProps) {
  return (
    <table className="analytics-table" {...props}>
      {children}
    </table>
  );
}
