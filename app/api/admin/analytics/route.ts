import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/system/auth/require-admin";
import { AnalyticsService } from "@/system/analytics/analytics.service";
import { getDatabase } from "@/system/database/connection";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  const campaign = request.nextUrl.searchParams.get("utm_campaign") ?? undefined;
  const service = new AnalyticsService(getDatabase());
  return NextResponse.json(service.getDashboard({ utmCampaign: campaign }));
}
