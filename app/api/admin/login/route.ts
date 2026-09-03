import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminCookieName,
  getAdminCookieOptions,
  verifyAdminPassword,
} from "@/system/auth/admin-session";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), token, getAdminCookieOptions());
  return response;
}
