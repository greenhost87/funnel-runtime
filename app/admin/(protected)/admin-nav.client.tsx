"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SecondaryActionButton } from "@/components/ui/secondary-action-button";
import { AdminNav as AdminNavRoot } from "@/components/layout/admin/admin-nav";

function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <SecondaryActionButton onClick={() => void logout()}>
      Logout
    </SecondaryActionButton>
  );
}

export function AdminShellNav() {
  return (
    <AdminNavRoot>
      <Link href="/admin/versions">Versions</Link>
      <Link href="/admin/analytics">Analytics</Link>
      <Link href="/admin/traffic">Traffic</Link>
      <AdminLogoutButton />
    </AdminNavRoot>
  );
}
