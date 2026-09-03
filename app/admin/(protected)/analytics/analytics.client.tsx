"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Option } from "@/components/ui/option";
import { Select } from "@/components/ui/select";
import { AdminCardTitle } from "@/components/layout/admin-card-title";
import { AnalyticsFilters } from "@/components/layout/analytics/analytics-filters";
import { FormField } from "@/components/layout/form-field";
import { AnalyticsDashboardSchema } from "@/system/analytics/analytics.schema";
import type { AnalyticsDashboard } from "@/system/analytics/analytics.service";
import { parseJsonFromReadable } from "@/system/http/json";
import { ComparisonTable, EdgeTable } from "@/app/components/analytics/analytics-tables";
import { SummaryCards } from "@/app/components/analytics/summary-cards";

type Props = {
  initialData: AnalyticsDashboard;
};

export function AnalyticsDashboardClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [campaign, setCampaign] = useState("");

  async function applyFilter(nextCampaign: string) {
    setCampaign(nextCampaign);
    const query = nextCampaign ? `?utm_campaign=${encodeURIComponent(nextCampaign)}` : "";
    const response = await fetch(`/api/admin/analytics${query}`);
    const payload = await parseJsonFromReadable(response, AnalyticsDashboardSchema);
    setData(payload);
  }

  return (
    <div>
      <AdminCardTitle>Analytics dashboard</AdminCardTitle>
      <AnalyticsFilters>
        <FormField>
          <Label htmlFor="campaign">UTM campaign</Label>
          <Select
            id="campaign"
            value={campaign}
            onChange={(event) => void applyFilter(event.target.value)}
          >
            <Option value="">All campaigns</Option>
            {data.campaigns.map((item) => (
              <Option key={item} value={item}>
                {item}
              </Option>
            ))}
          </Select>
        </FormField>
      </AnalyticsFilters>
      <SummaryCards summary={data.summary} />
      <EdgeTable edges={data.edges} />
      <ComparisonTable comparisons={data.comparisons} />
    </div>
  );
}
