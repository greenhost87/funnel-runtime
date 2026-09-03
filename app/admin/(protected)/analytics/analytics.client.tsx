"use client";

import { useState } from "react";
import type { AnalyticsDashboard } from "@/system/analytics/analytics.service";
import { ComparisonTable } from "@/app/components/analytics/comparison-table";
import { EdgeTable } from "@/app/components/analytics/edge-table";
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
    const payload = (await response.json()) as AnalyticsDashboard;
    setData(payload);
  }

  return (
    <div>
      <h1 className="admin-card__title">Analytics dashboard</h1>
      <div className="analytics-filters">
        <div className="form-field">
          <label className="form-label" htmlFor="campaign">
            UTM campaign
          </label>
          <select
            id="campaign"
            className="form-select"
            value={campaign}
            onChange={(event) => void applyFilter(event.target.value)}
          >
            <option value="">All campaigns</option>
            {data.campaigns.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <SummaryCards summary={data.summary} />
      <EdgeTable edges={data.edges} />
      <ComparisonTable comparisons={data.comparisons} />
    </div>
  );
}
