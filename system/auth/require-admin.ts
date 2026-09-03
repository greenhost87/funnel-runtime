import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/system/auth/admin-session";
import { jsonResponse } from "@/system/http/json";

async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminPage(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function requireAdminApi() {
  if (!(await isAdminAuthenticated())) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
