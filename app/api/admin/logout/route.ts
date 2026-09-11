import { clearAdminSessionCookie } from "@/system/auth/clear-admin-session-cookie";
import { jsonResponse } from "@/system/http/json";
import { withApiLog } from "@/system/logging/with-api-log";

export const POST = withApiLog(function POST() {
  const response = jsonResponse({ ok: true });
  clearAdminSessionCookie(response.cookies);
  return response;
});
