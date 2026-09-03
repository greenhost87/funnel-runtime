import { ADMIN_COOKIE_NAME } from "@/system/auth/admin-session";
import { jsonResponse } from "@/system/http/json";

export function POST() {
  const response = jsonResponse({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
