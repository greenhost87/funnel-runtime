"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button className="btn btn--secondary" type="button" onClick={() => void logout()}>
      Logout
    </button>
  );
}

export function AdminNav() {
  return (
    <nav className="admin-nav">
      <Link href="/admin/versions">Versions</Link>
      <Link href="/admin/analytics">Analytics</Link>
      <AdminLogoutButton />
    </nav>
  );
}
