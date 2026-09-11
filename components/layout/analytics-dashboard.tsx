"use client";

import type { EdgeMetric, AnalyticsLabels } from "@/system/analytics/analytics.service";
import {
  AnalyticsCardLabel,
  AnalyticsCardValue,
  AnalyticsFilters,
} from "@/components/layout/analytics-primitives";
import { AnalyticsCard } from "@/components/layout/analytics-card";
import { resolveStepLabel, resolveVersionLabel } from "@/components/layout/analytics-labels";
import { formatRate } from "@/components/layout/analytics-table-section";
import {
  ANALYTICS_DETAIL_PANELS,
  AnalyticsCharts,
  type AnalyticsDetailPanel,
} from "@/components/layout/analytics-charts";
import { AdminCardTitle, DateField, FormError } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { AnalyticsEmpty } from "@/components/ui/analytics-shell";
import { DtCell } from "@/components/ui/dt-table/dt-table";
import { AdminDataTable } from "@/components/layout/admin-data-table";
import type { AnalyticsDashboard as AnalyticsDashboardData } from "@/system/analytics/analytics.service";

type FilterState = {
  campaign: string;
  variant: string;
  versionId: string;
  dateFrom: string;
  dateTo: string;
};

type AnalyticsDashboardProps = {
  data: AnalyticsDashboardData;
  filters: FilterState;
  loading: boolean;
  error: string | null;
  detailPanel: AnalyticsDetailPanel | null;
  onFiltersChange: (next: FilterState) => void;
  onDetailPanelChange: (panel: AnalyticsDetailPanel | null) => void;
};

const COMPARISON_HEADERS = [
  "Version",
  "Variant",
  "Sessions started",
  "CTA from start",
  "Result reach",
  "CTA CTR",
] as const;

const EDGE_HEADERS = [
  "Version",
  "Variant",
  "From",
  "To",
  "Views",
  "Completions",
  "Conversion",
  "Drop-off",
] as const;

function formatVersionLabel(name: string, versionId: string): string {
  return name || (versionId.length > 12 ? `${versionId.slice(0, 8)}…` : versionId);
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

export function AnalyticsDashboard({
  data,
  filters,
  loading,
  error,
  detailPanel,
  onFiltersChange,
  onDetailPanelChange,
}: AnalyticsDashboardProps) {
  const labels = data.labels;

  return (
    <div>
      <AdminCardTitle>Analytics dashboard</AdminCardTitle>
      {error ? <FormError role="alert">{error}</FormError> : null}
      <AnalyticsFilters>
        <Select
          id="campaign"
          label="UTM campaign"
          value={filters.campaign}
          disabled={loading}
          onChange={(event) => {
            onFiltersChange({ ...filters, campaign: event.target.value });
          }}
          options={[
            { value: "", label: "All campaigns" },
            ...data.campaigns.map((item) => ({ value: item, label: item })),
          ]}
        />
        <Select
          id="variant"
          label="Variant"
          value={filters.variant}
          disabled={loading}
          onChange={(event) => {
            onFiltersChange({ ...filters, variant: event.target.value });
          }}
          options={[
            { value: "", label: "All variants" },
            { value: "A", label: "A" },
            { value: "B", label: "B" },
          ]}
        />
        <Select
          id="versionId"
          label="Survey version"
          value={filters.versionId}
          disabled={loading}
          onChange={(event) => {
            onFiltersChange({ ...filters, versionId: event.target.value });
          }}
          options={[
            { value: "", label: "All versions" },
            ...data.versions.map((item) => ({
              value: item.versionId,
              label: formatVersionLabel(item.name, item.versionId),
            })),
          ]}
        />
        <DateField
          id="dateFrom"
          label="From"
          value={filters.dateFrom}
          disabled={loading}
          onChange={(nextValue) => {
            onFiltersChange({ ...filters, dateFrom: nextValue });
          }}
        />
        <DateField
          id="dateTo"
          label="To"
          value={filters.dateTo}
          disabled={loading}
          onChange={(nextValue) => {
            onFiltersChange({ ...filters, dateTo: nextValue });
          }}
        />
      </AnalyticsFilters>
      <div className="analytics-grid">
        <AnalyticsCard>
          <AnalyticsCardLabel>Sessions started</AnalyticsCardLabel>
          <AnalyticsCardValue>{data.summary.sessionsStarted}</AnalyticsCardValue>
        </AnalyticsCard>
        <AnalyticsCard primary>
          <AnalyticsCardLabel>Primary metric: CTA-from-start conversion</AnalyticsCardLabel>
          <AnalyticsCardValue>
            {formatRate(data.summary.primaryCtaFromStartConversion)}
          </AnalyticsCardValue>
        </AnalyticsCard>
        <AnalyticsCard>
          <AnalyticsCardLabel>Result reach rate</AnalyticsCardLabel>
          <AnalyticsCardValue>{formatRate(data.summary.resultReachRate)}</AnalyticsCardValue>
        </AnalyticsCard>
        <AnalyticsCard>
          <AnalyticsCardLabel>CTA CTR (from result viewers)</AnalyticsCardLabel>
          <AnalyticsCardValue>{formatRate(data.summary.ctaCtr)}</AnalyticsCardValue>
        </AnalyticsCard>
      </div>
      <AnalyticsCharts
        stepFunnel={data.stepFunnel}
        sessionsByDay={data.sessionsByDay}
        comparisons={data.comparisons}
        labels={labels}
        detailPanel={detailPanel}
        onDetailPanelChange={onDetailPanelChange}
      />
      {detailPanel === ANALYTICS_DETAIL_PANELS[0] ? (
        data.edges.length === 0 ? (
          <AnalyticsEmpty>No edge data yet.</AnalyticsEmpty>
        ) : (
          <>
            <AdminCardTitle as="h2">Step transitions and drop-off</AdminCardTitle>
            <AdminDataTable columns={EDGE_HEADERS}>
              {data.edges.map((edge) => (
                <div
                  key={`${edge.versionId}-${edge.variant}-${edge.fromStepId}-${edge.toStepId ?? "result"}`}
                >
                  <DtCell label="Version">{resolveVersionLabel(edge.versionId, labels)}</DtCell>
                  <DtCell label="Variant">{edge.variant}</DtCell>
                  <DtCell label="From">
                    {resolveStepLabel(edge.versionId, edge.fromStepId, labels)}
                  </DtCell>
                  <DtCell label="To">{formatEdgeToLabel(edge, labels)}</DtCell>
                  <DtCell label="Views">{edge.views}</DtCell>
                  <DtCell label="Completions">{edge.completions}</DtCell>
                  <DtCell label="Conversion">{formatRate(edge.conversionRate)}</DtCell>
                  <DtCell label="Drop-off">{formatRate(edge.dropOffRate)}</DtCell>
                </div>
              ))}
            </AdminDataTable>
          </>
        )
      ) : null}
      {detailPanel === ANALYTICS_DETAIL_PANELS[1] ? (
        data.comparisons.length === 0 ? (
          <AnalyticsEmpty>No A/B or version comparisons yet.</AnalyticsEmpty>
        ) : (
          <>
            <AdminCardTitle as="h2">A/B and version comparison</AdminCardTitle>
            <AdminDataTable columns={COMPARISON_HEADERS}>
              {data.comparisons.map((row) => (
                <div key={`${row.versionId}:${row.variant}`}>
                  <DtCell label="Version">{resolveVersionLabel(row.versionId, labels)}</DtCell>
                  <DtCell label="Variant">{row.variant}</DtCell>
                  <DtCell label="Sessions started">{row.started}</DtCell>
                  <DtCell label="CTA from start">
                    {formatRate(row.primaryCtaFromStartConversion)}
                  </DtCell>
                  <DtCell label="Result reach">{formatRate(row.resultReachRate)}</DtCell>
                  <DtCell label="CTA CTR">{formatRate(row.ctaCtr)}</DtCell>
                </div>
              ))}
            </AdminDataTable>
          </>
        )
      ) : null}
    </div>
  );
}
