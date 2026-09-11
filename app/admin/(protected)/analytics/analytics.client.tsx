"use client";

import { useState } from "react";
import { AnalyticsDashboard } from "@/components/layout/analytics-dashboard";
import { type AnalyticsDetailPanel } from "@/components/layout/analytics-charts";
import { getAnalyticsDashboardAction } from "@/app/actions/admin";
import type { AnalyticsDashboard as AnalyticsDashboardData } from "@/system/analytics/analytics.service";

type FilterState = {
  campaign: string;
  variant: string;
  versionId: string;
  dateFrom: string;
  dateTo: string;
};

type Props = {
  initialData: AnalyticsDashboardData;
};

type AnalyticsFilterHandlers = {
  setFilters: (filters: FilterState) => void;
  setLoading: (loading: boolean) => void;
  setData: (data: AnalyticsDashboardData) => void;
  setError: (error: string | null) => void;
};

async function applyAnalyticsFilters(
  previousFilters: FilterState,
  nextFilters: FilterState,
  handlers: AnalyticsFilterHandlers,
) {
  handlers.setFilters(nextFilters);
  handlers.setLoading(true);
  handlers.setError(null);
  const result = await getAnalyticsDashboardAction({
    campaign: nextFilters.campaign || undefined,
    variant: nextFilters.variant || undefined,
    versionId: nextFilters.versionId || undefined,
    dateFrom: nextFilters.dateFrom || undefined,
    dateTo: nextFilters.dateTo || undefined,
  });
  if (result.ok) {
    handlers.setData(result.data);
  } else {
    handlers.setFilters(previousFilters);
    handlers.setError(result.error);
  }
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
  const [error, setError] = useState<string | null>(null);
  const [detailPanel, setDetailPanel] = useState<AnalyticsDetailPanel | null>(null);
  const filterHandlers: AnalyticsFilterHandlers = { setFilters, setLoading, setData, setError };

  function updateFilters(nextFilters: FilterState) {
    setDetailPanel(null);
    void applyAnalyticsFilters(filters, nextFilters, filterHandlers);
  }

  return (
    <AnalyticsDashboard
      data={data}
      filters={filters}
      loading={loading}
      error={error}
      detailPanel={detailPanel}
      onFiltersChange={updateFilters}
      onDetailPanelChange={setDetailPanel}
    />
  );
}
