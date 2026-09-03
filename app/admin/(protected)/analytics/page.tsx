import { getDatabase } from "@/system/database/connection";
import { AnalyticsService } from "@/system/analytics/analytics.service";
import { AnalyticsDashboardClient } from "@/app/admin/(protected)/analytics/analytics.client";

export default function AnalyticsPage() {
  const service = new AnalyticsService(getDatabase());
  const initialData = service.getDashboard();
  return <AnalyticsDashboardClient initialData={initialData} />;
}
