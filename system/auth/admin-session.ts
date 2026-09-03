import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookiePath } from "@/system/config/base-path";
import { getRequiredEnv, isNodeEnvironment } from "@/system/config/environment";

export const ADMIN_COOKIE_NAME = "funnel_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function sign(payload: string): string {
  return createHmac("sha256", getRequiredEnv("ADMIN_SIGNING_SECRET")).update(payload).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getRequiredEnv("ADMIN_PASSWORD");
  if (password.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export function createAdminSessionToken(): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  const [expiresRaw, signature] = token.split(".");
  if (!expiresRaw || !signature) {
    return false;
  }
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }
  const expected = sign(expiresRaw);
  if (expected.length !== signature.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function getAdminCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isNodeEnvironment("production"),
    path: getCookiePath(),
    maxAge: MAX_AGE_SECONDS,
  };
}
