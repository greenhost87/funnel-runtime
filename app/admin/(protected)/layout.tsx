import { requireAdminPage } from "@/system/auth/require-admin";
import { AdminShellNav } from "@/components/layout/admin-shell-nav";
import { AdminShell } from "@/components/layout/admin-primitives";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return <AdminShell nav={<AdminShellNav />}>{children}</AdminShell>;
}
