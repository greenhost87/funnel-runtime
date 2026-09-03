"use client";

import type { EdgeMetric } from "@/system/analytics/analytics.service";

function formatRate(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function EdgeTable({ edges }: { edges: EdgeMetric[] }) {
  if (edges.length === 0) {
    return <p className="analytics-empty">No edge data yet.</p>;
  }

  return (
    <div className="analytics-table-wrap">
      <h2 className="admin-card__title">Step transitions and drop-off</h2>
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Variant</th>
            <th>From</th>
            <th>To</th>
            <th>Views</th>
            <th>Completions</th>
            <th>Conversion</th>
            <th>Drop-off</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => (
            <tr
              key={`${edge.versionId}-${edge.variant}-${edge.fromStepId}-${edge.toStepId ?? "result"}`}
            >
              <td>{edge.versionId.slice(0, 8)}…</td>
              <td>{edge.variant}</td>
              <td>{edge.fromStepId}</td>
              <td>{edge.toResult ? "result" : edge.toStepId}</td>
              <td>{edge.views}</td>
              <td>{edge.completions}</td>
              <td>{formatRate(edge.conversionRate)}</td>
              <td>{formatRate(edge.dropOffRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
