import { ADMIN_COOKIE_NAME, getAdminCookieOptions } from "@/system/auth/admin-session";
import { logger } from "@/system/logging/logger";

type ClearedAdminCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

type CookieSetter = {
  set: (name: string, value: string, options: ClearedAdminCookieOptions) => void;
};

export function clearAdminSessionCookie(store: CookieSetter): void {
  const options: ClearedAdminCookieOptions = {
    ...getAdminCookieOptions(),
    maxAge: 0,
  };
  store.set(ADMIN_COOKIE_NAME, "", options);
  logger.info("admin.logout", { result: "success" });
}
