import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { getDatabase } from "@/system/database/connection";
import { jsonResponse } from "@/system/http/json";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";
import type { AnalyticsFilters } from "@/system/database/analytics/analytics.dao";
import type { FunnelVariant } from "@/system/funnel/config.types";

function parseFilters(request: Request): AnalyticsFilters {
  const params = new URL(request.url).searchParams;
  const variant = params.get("variant");
  const filters: AnalyticsFilters = {};

  const campaign = params.get("utm_campaign");
  if (campaign) {
    filters.utmCampaign = campaign;
  }

  if (variant === "A" || variant === "B") {
    filters.variant = variant satisfies FunnelVariant;
  }

  const versionId = params.get("version_id");
  if (versionId) {
    filters.versionId = versionId;
  }

  const dateFrom = params.get("date_from");
  if (dateFrom) {
    filters.dateFrom = dateFrom;
  }

  const dateTo = params.get("date_to");
  if (dateTo) {
    filters.dateTo = dateTo;
  }

  return filters;
}

export const GET = withAdminApiLog(function GET(request: Request) {
  const service = createAnalyticsService(getDatabase());
  return jsonResponse(service.getDashboard(parseFilters(request)));
});
