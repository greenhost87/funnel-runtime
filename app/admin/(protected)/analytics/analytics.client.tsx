"use client";

import { useState } from "react";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Option } from "@/components/ui/primitives";
import { Select } from "@/components/ui/select";
import { AdminCardTitle, FormField } from "@/components/layout/primitives";
import { AnalyticsFilters } from "@/components/layout/analytics-primitives";
import { AnalyticsDashboardSchema } from "@/system/analytics/analytics.schema";
import type { AnalyticsDashboard } from "@/system/analytics/analytics.service";
import { parseJsonFromReadable } from "@/system/http/json";
import { ComparisonTable, EdgeTable } from "@/app/components/analytics/analytics-tables";
import { AnalyticsCharts } from "@/app/components/analytics/analytics-charts";
import { SummaryCards } from "@/app/components/analytics/summary-cards";

type FilterState = {
  campaign: string;
  variant: string;
  versionId: string;
  dateFrom: string;
  dateTo: string;
};

type Props = {
  initialData: AnalyticsDashboard;
};

function buildAnalyticsQuery(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.campaign) {
    params.set("utm_campaign", filters.campaign);
  }
  if (filters.variant) {
    params.set("variant", filters.variant);
  }
  if (filters.versionId) {
    params.set("version_id", filters.versionId);
  }
  if (filters.dateFrom) {
    params.set("date_from", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set("date_to", filters.dateTo);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function formatVersionLabel(versionId: string): string {
  return versionId.length > 12 ? `${versionId.slice(0, 8)}…` : versionId;
}

type AnalyticsFilterHandlers = {
  setFilters: (filters: FilterState) => void;
  setLoading: (loading: boolean) => void;
  setData: (data: AnalyticsDashboard) => void;
};

async function applyAnalyticsFilters(nextFilters: FilterState, handlers: AnalyticsFilterHandlers) {
  handlers.setFilters(nextFilters);
  handlers.setLoading(true);
  const response = await fetch(`/api/admin/analytics${buildAnalyticsQuery(nextFilters)}`);
  const payload = await parseJsonFromReadable(response, AnalyticsDashboardSchema);
  handlers.setData(payload);
  handlers.setLoading(false);
}

export function AnalyticsDashboardClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<FilterState>({
    campaign: "",
    variant: "",
    versionId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(false);
  const filterHandlers: AnalyticsFilterHandlers = { setFilters, setLoading, setData };

  return (
    <div>
      <AdminCardTitle>Analytics dashboard</AdminCardTitle>
      <AnalyticsFilters>
        <Select
          id="campaign"
          label="UTM campaign"
          value={filters.campaign}
          disabled={loading}
          onChange={(event) => {
            void applyAnalyticsFilters(
              { ...filters, campaign: event.target.value },
              filterHandlers,
            );
          }}
        >
          <Option value="">All campaigns</Option>
          {data.campaigns.map((item) => (
            <Option key={item} value={item}>
              {item}
            </Option>
          ))}
        </Select>
        <Select
          id="variant"
          label="Variant"
          value={filters.variant}
          disabled={loading}
          onChange={(event) => {
            void applyAnalyticsFilters({ ...filters, variant: event.target.value }, filterHandlers);
          }}
        >
          <Option value="">All variants</Option>
          <Option value="A">A</Option>
          <Option value="B">B</Option>
        </Select>
        <Select
          id="versionId"
          label="Version"
          value={filters.versionId}
          disabled={loading}
          onChange={(event) => {
            void applyAnalyticsFilters(
              { ...filters, versionId: event.target.value },
              filterHandlers,
            );
          }}
        >
          <Option value="">All versions</Option>
          {data.versions.map((item) => (
            <Option key={item} value={item}>
              {formatVersionLabel(item)}
            </Option>
          ))}
        </Select>
        <FormField>
          <Label htmlFor="dateFrom">From</Label>
          <DateInput
            id="dateFrom"
            value={filters.dateFrom}
            disabled={loading}
            onChange={(nextValue) => {
              void applyAnalyticsFilters({ ...filters, dateFrom: nextValue }, filterHandlers);
            }}
          />
        </FormField>
        <FormField>
          <Label htmlFor="dateTo">To</Label>
          <DateInput
            id="dateTo"
            value={filters.dateTo}
            disabled={loading}
            onChange={(nextValue) => {
              void applyAnalyticsFilters({ ...filters, dateTo: nextValue }, filterHandlers);
            }}
          />
        </FormField>
      </AnalyticsFilters>
      <SummaryCards summary={data.summary} />
      <AnalyticsCharts
        stepFunnel={data.stepFunnel}
        sessionsByDay={data.sessionsByDay}
        comparisons={data.comparisons}
      />
      <EdgeTable edges={data.edges} />
      <ComparisonTable comparisons={data.comparisons} />
    </div>
  );
}
