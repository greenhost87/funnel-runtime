import type { ReactNode } from "react";
import { AdminCardTitle } from "@/components/layout/primitives";
import { AnalyticsEmpty, AnalyticsTableWrap } from "@/components/layout/analytics-primitives";
import { DtHeader, DtTable } from "@/components/ui/dt-table/dt-table";

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
      <DtTable>
        <DtHeader columns={headers} />
        {rows.map((row) => (
          <div key={rowKey(row)}>{renderRow(row)}</div>
        ))}
      </DtTable>
    </AnalyticsTableWrap>
  );
}

export function formatRate(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}
