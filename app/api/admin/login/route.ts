import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminCookieOptions,
  verifyAdminPassword,
} from "@/system/auth/admin-session";
import { LoginRequestSchema } from "@/system/funnel/api-response.schema";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { logger } from "@/system/logging/logger";
import { withApiLog } from "@/system/logging/with-api-log";

export const POST = withApiLog(async function POST(request: Request) {
  const body = await parseJsonFromReadable(request, LoginRequestSchema);
  if (!verifyAdminPassword(body.password)) {
    logger.warn("admin.login", { result: "failure" });
    return jsonResponse({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = createAdminSessionToken();
  const response = jsonResponse({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, getAdminCookieOptions());
  logger.info("admin.login", { result: "success" });
  return response;
});
