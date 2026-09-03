"use client";

import type { AnalyticsSummary } from "@/system/analytics/analytics.service";
import { AnalyticsCard } from "@/components/layout/class-tagged";
import {
  AnalyticsCardLabel,
  AnalyticsCardValue,
  AnalyticsGrid,
} from "@/components/layout/analytics-primitives";
import { formatRate } from "@/app/components/analytics/analytics-table-section";

export function SummaryCards({ summary }: { summary: AnalyticsSummary }) {
  return (
    <AnalyticsGrid>
      <AnalyticsCard>
        <AnalyticsCardLabel>Sessions started</AnalyticsCardLabel>
        <AnalyticsCardValue>{summary.sessionsStarted}</AnalyticsCardValue>
      </AnalyticsCard>
      <AnalyticsCard primary>
        <AnalyticsCardLabel>Primary metric: CTA-from-start conversion</AnalyticsCardLabel>
        <AnalyticsCardValue>{formatRate(summary.primaryCtaFromStartConversion)}</AnalyticsCardValue>
      </AnalyticsCard>
      <AnalyticsCard>
        <AnalyticsCardLabel>Result reach rate</AnalyticsCardLabel>
        <AnalyticsCardValue>{formatRate(summary.resultReachRate)}</AnalyticsCardValue>
      </AnalyticsCard>
      <AnalyticsCard>
        <AnalyticsCardLabel>CTA CTR (from result viewers)</AnalyticsCardLabel>
        <AnalyticsCardValue>{formatRate(summary.ctaCtr)}</AnalyticsCardValue>
      </AnalyticsCard>
    </AnalyticsGrid>
  );
}
