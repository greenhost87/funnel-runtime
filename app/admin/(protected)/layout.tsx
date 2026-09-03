import { requireAdminPage } from "@/system/auth/require-admin";
import { AdminShellNav } from "@/app/admin/(protected)/admin-nav.client";
import { AdminLayout } from "@/components/layout/admin/admin-layout";
import { AdminMain } from "@/components/layout/admin/admin-main";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <AdminLayout>
      <AdminShellNav />
      <AdminMain>{children}</AdminMain>
    </AdminLayout>
  );
}
