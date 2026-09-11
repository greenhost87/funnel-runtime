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
};

async function applyAnalyticsFilters(nextFilters: FilterState, handlers: AnalyticsFilterHandlers) {
  handlers.setFilters(nextFilters);
  handlers.setLoading(true);
  const result = await getAnalyticsDashboardAction({
    campaign: nextFilters.campaign || undefined,
    variant: nextFilters.variant || undefined,
    versionId: nextFilters.versionId || undefined,
    dateFrom: nextFilters.dateFrom || undefined,
    dateTo: nextFilters.dateTo || undefined,
  });
  if (result.ok) {
    handlers.setData(result.data);
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
  const [detailPanel, setDetailPanel] = useState<AnalyticsDetailPanel | null>(null);
  const filterHandlers: AnalyticsFilterHandlers = { setFilters, setLoading, setData };

  function updateFilters(nextFilters: FilterState) {
    setDetailPanel(null);
    void applyAnalyticsFilters(nextFilters, filterHandlers);
  }

  return (
    <AnalyticsDashboard
      data={data}
      filters={filters}
      loading={loading}
      detailPanel={detailPanel}
      onFiltersChange={updateFilters}
      onDetailPanelChange={setDetailPanel}
    />
  );
}
