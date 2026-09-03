"use client";

import type { EdgeMetric, AnalyticsLabels } from "@/system/analytics/analytics.service";
import { resolveStepLabel, resolveVersionLabel } from "@/app/components/analytics/analytics-labels";
import {
  AnalyticsTableSection,
  formatRate,
} from "@/app/components/analytics/analytics-table-section";
import { DtCell } from "@/components/ui/dt-table/dt-table";

type ComparisonRow = {
  versionId: string;
  variant: string;
  started: number;
  primaryCtaFromStartConversion: number | null;
  resultReachRate: number | null;
  ctaCtr: number | null;
};

export function ComparisonTable({
  comparisons,
  labels,
}: {
  comparisons: ComparisonRow[];
  labels: AnalyticsLabels;
}) {
  return (
    <AnalyticsTableSection
      title="A/B and version comparison"
      emptyMessage="No A/B or version comparisons yet."
      rows={comparisons}
      headers={[
        "Version",
        "Variant",
        "Sessions started",
        "CTA from start",
        "Result reach",
        "CTA CTR",
      ]}
      rowKey={(row) => `${row.versionId}:${row.variant}`}
      renderRow={(row) => (
        <>
          <DtCell label="Version">{resolveVersionLabel(row.versionId, labels)}</DtCell>
          <DtCell label="Variant">{row.variant}</DtCell>
          <DtCell label="Sessions started">{row.started}</DtCell>
          <DtCell label="CTA from start">{formatRate(row.primaryCtaFromStartConversion)}</DtCell>
          <DtCell label="Result reach">{formatRate(row.resultReachRate)}</DtCell>
          <DtCell label="CTA CTR">{formatRate(row.ctaCtr)}</DtCell>
        </>
      )}
    />
  );
}

function formatEdgeToLabel(edge: EdgeMetric, labels: AnalyticsLabels): string {
  if (edge.toResult) {
    return "result";
  }
  if (edge.toStepId) {
    return resolveStepLabel(edge.versionId, edge.toStepId, labels);
  }
  return "—";
}

function EdgeTableRow({ edge, labels }: { edge: EdgeMetric; labels: AnalyticsLabels }) {
  return (
    <>
      <DtCell label="Version">{resolveVersionLabel(edge.versionId, labels)}</DtCell>
      <DtCell label="Variant">{edge.variant}</DtCell>
      <DtCell label="From">{resolveStepLabel(edge.versionId, edge.fromStepId, labels)}</DtCell>
      <DtCell label="To">{formatEdgeToLabel(edge, labels)}</DtCell>
      <DtCell label="Views">{edge.views}</DtCell>
      <DtCell label="Completions">{edge.completions}</DtCell>
      <DtCell label="Conversion">{formatRate(edge.conversionRate)}</DtCell>
      <DtCell label="Drop-off">{formatRate(edge.dropOffRate)}</DtCell>
    </>
  );
}

export function EdgeTable({ edges, labels }: { edges: EdgeMetric[]; labels: AnalyticsLabels }) {
  return (
    <AnalyticsTableSection
      title="Step transitions and drop-off"
      emptyMessage="No edge data yet."
      rows={edges}
      headers={[
        "Version",
        "Variant",
        "From",
        "To",
        "Views",
        "Completions",
        "Conversion",
        "Drop-off",
      ]}
      rowKey={(edge) =>
        `${edge.versionId}-${edge.variant}-${edge.fromStepId}-${edge.toStepId ?? "result"}`
      }
      renderRow={(edge) => <EdgeTableRow edge={edge} labels={labels} />}
    />
  );
}
