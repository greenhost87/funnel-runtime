import { requireAdminPage } from "@/system/auth/require-admin";
import { AdminShellNav } from "@/app/admin/(protected)/admin-nav.client";
import { AdminLayout, AdminMain } from "@/components/layout/admin-primitives";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <AdminLayout>
      <AdminShellNav />
      <AdminMain>{children}</AdminMain>
    </AdminLayout>
  );
}
