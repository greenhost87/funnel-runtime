"use client";

import type { AnalyticsSummary } from "@/system/analytics/analytics.service";

function formatRate(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function SummaryCards({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="analytics-grid">
      <div className="analytics-card">
        <div className="analytics-card__label">Sessions started</div>
        <div className="analytics-card__value">{summary.sessionsStarted}</div>
      </div>
      <div className="analytics-card analytics-card--primary">
        <div className="analytics-card__label">Primary metric: CTA-from-start conversion</div>
        <div className="analytics-card__value">
          {formatRate(summary.primaryCtaFromStartConversion)}
        </div>
      </div>
      <div className="analytics-card">
        <div className="analytics-card__label">Result reach rate</div>
        <div className="analytics-card__value">{formatRate(summary.resultReachRate)}</div>
      </div>
      <div className="analytics-card">
        <div className="analytics-card__label">CTA CTR (from result viewers)</div>
        <div className="analytics-card__value">{formatRate(summary.ctaCtr)}</div>
      </div>
    </div>
  );
}
