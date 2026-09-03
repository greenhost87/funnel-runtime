import type { ReactNode } from "react";
import { AdminCardTitle } from "@/components/layout/admin-card-title";
import { AnalyticsEmpty } from "@/components/layout/analytics/analytics-empty";
import { AnalyticsTable } from "@/components/layout/analytics/analytics-table";
import { AnalyticsTableWrap } from "@/components/layout/analytics/analytics-table-wrap";

type AnalyticsTableSectionProps<TRow> = {
  title: string;
  emptyMessage: string;
  rows: TRow[];
  headers: string[];
  renderRow: (row: TRow) => ReactNode;
  rowKey: (row: TRow) => string;
};

export function AnalyticsTableSection<TRow>({
  title,
  emptyMessage,
  rows,
  headers,
  renderRow,
  rowKey,
}: AnalyticsTableSectionProps<TRow>) {
  if (rows.length === 0) {
    return <AnalyticsEmpty>{emptyMessage}</AnalyticsEmpty>;
  }

  return (
    <AnalyticsTableWrap>
      <AdminCardTitle as="h2">{title}</AdminCardTitle>
      <AnalyticsTable>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((row) => (
          <tr key={rowKey(row)}>{renderRow(row)}</tr>
        ))}</tbody>
      </AnalyticsTable>
    </AnalyticsTableWrap>
  );
}

export function formatRate(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}
