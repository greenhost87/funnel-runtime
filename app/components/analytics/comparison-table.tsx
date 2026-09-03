"use client";

import type { AnalyticsDashboard } from "@/system/analytics/analytics.service";

function formatRate(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function ComparisonTable({
  comparisons,
}: {
  comparisons: AnalyticsDashboard["comparisons"];
}) {
  if (comparisons.length === 0) {
    return <p className="analytics-empty">No A/B or version comparisons yet.</p>;
  }

  return (
    <div className="analytics-table-wrap">
      <h2 className="admin-card__title">A/B and version comparison</h2>
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Variant</th>
            <th>Started</th>
            <th>Primary CTA-from-start</th>
            <th>Result reach</th>
            <th>CTA CTR</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((row) => (
            <tr key={`${row.versionId}-${row.variant}`}>
              <td>{row.versionId.slice(0, 8)}…</td>
              <td>{row.variant}</td>
              <td>{row.started}</td>
              <td>{formatRate(row.primaryCtaFromStartConversion)}</td>
              <td>{formatRate(row.resultReachRate)}</td>
              <td>{formatRate(row.ctaCtr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
