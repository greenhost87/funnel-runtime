"use client";

import type { EdgeMetric } from "@/system/analytics/analytics.service";
import {
  AnalyticsTableSection,
  formatRate,
} from "@/app/components/analytics/analytics-table-section";

type ComparisonRow = {
  versionId: string;
  variant: string;
  started: number;
  primaryCtaFromStartConversion: number | null;
  resultReachRate: number | null;
  ctaCtr: number | null;
};

export function ComparisonTable({ comparisons }: { comparisons: ComparisonRow[] }) {
  return (
    <AnalyticsTableSection
      title="A/B and version comparison"
      emptyMessage="No A/B or version comparisons yet."
      rows={comparisons}
      headers={["Version", "Variant", "Sessions started", "CTA from start", "Result reach", "CTA CTR"]}
      rowKey={(row) => `${row.versionId}:${row.variant}`}
      renderRow={(row) => (
        <>
          <td>{row.versionId}</td>
          <td>{row.variant}</td>
          <td>{row.started}</td>
          <td>{formatRate(row.primaryCtaFromStartConversion)}</td>
          <td>{formatRate(row.resultReachRate)}</td>
          <td>{formatRate(row.ctaCtr)}</td>
        </>
      )}
    />
  );
}

export function EdgeTable({ edges }: { edges: EdgeMetric[] }) {
  return (
    <AnalyticsTableSection
      title="Step transitions and drop-off"
      emptyMessage="No edge data yet."
      rows={edges}
      headers={["Version", "Variant", "From", "To", "Views", "Completions", "Conversion", "Drop-off"]}
      rowKey={(edge) => `${edge.versionId}-${edge.variant}-${edge.fromStepId}-${edge.toStepId ?? "result"}`}
      renderRow={(edge) => (
        <>
          <td>{edge.versionId.slice(0, 8)}…</td>
          <td>{edge.variant}</td>
          <td>{edge.fromStepId}</td>
          <td>{edge.toResult ? "result" : edge.toStepId}</td>
          <td>{edge.views}</td>
          <td>{edge.completions}</td>
          <td>{formatRate(edge.conversionRate)}</td>
          <td>{formatRate(edge.dropOffRate)}</td>
        </>
      )}
    />
  );
}
