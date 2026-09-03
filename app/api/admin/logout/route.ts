import { ADMIN_COOKIE_NAME, getAdminCookieOptions } from "@/system/auth/admin-session";
import { jsonResponse } from "@/system/http/json";
import { logger } from "@/system/logging/logger";
import { withApiLog } from "@/system/logging/with-api-log";

export const POST = withApiLog(function POST() {
  const response = jsonResponse({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...getAdminCookieOptions(), maxAge: 0 });
  logger.info("admin.logout", { result: "success" });
  return response;
});
