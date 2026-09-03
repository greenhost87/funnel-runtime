import { getDatabase } from "@/system/database/connection";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { AnalyticsDashboardClient } from "@/app/admin/(protected)/analytics/analytics.client";

function getAnalyticsPageData() {
  return createAnalyticsService(getDatabase()).getDashboard();
}

export default function AnalyticsPage() {
  const initialData = getAnalyticsPageData();
  return <AnalyticsDashboardClient initialData={initialData} />;
}
