import { requireAdminPage } from "@/system/auth/require-admin";
import { AdminNav } from "@/app/admin/(protected)/admin-nav.client";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
  );
}
