import { type NextRequest } from "next/server";
import { requireAdminApi } from "@/system/auth/require-admin";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import { getDatabase } from "@/system/database/connection";
import { jsonResponse } from "@/system/http/json";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  const campaign = request.nextUrl.searchParams.get("utm_campaign") ?? undefined;
  const service = createAnalyticsService(getDatabase());
  return jsonResponse(service.getDashboard({ utmCampaign: campaign }));
}
