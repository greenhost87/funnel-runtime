import { describe, expect, test } from "bun:test";
import {
  createAdminSessionToken,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from "@/system/auth/admin-session";

describe("admin session", () => {
  test("valid password and token lifecycle", () => {
    process.env.ADMIN_PASSWORD = "test-password";
    process.env.ADMIN_SIGNING_SECRET = "test-signing-secret";
    expect(verifyAdminPassword("test-password")).toBe(true);
    expect(verifyAdminPassword("wrong")).toBe(false);
    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(token)).toBe(true);
    expect(verifyAdminSessionToken(`${token}tampered`)).toBe(false);
  });
});
