import { describe, expect, test } from "bun:test";
import {
  createAdminSessionToken,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from "@/system/auth/admin-session";
import { setEnv } from "@/system/config/environment";

describe("admin session", () => {
  test("valid password and token lifecycle", () => {
    setEnv("ADMIN_PASSWORD", "test-password");
    setEnv("ADMIN_SIGNING_SECRET", "test-signing-secret");
    expect(verifyAdminPassword("test-password")).toBe(true);
    expect(verifyAdminPassword("wrong")).toBe(false);
    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(token)).toBe(true);
    expect(verifyAdminSessionToken(`${token}tampered`)).toBe(false);
  });
});
