import { VersionsClient } from "@/app/admin/(protected)/versions/versions.client";
import { getVersionAdminData } from "@/app/admin/get-version-admin-data";

export default function VersionsPage() {
  const { active, history } = getVersionAdminData();
  return <VersionsClient initialActive={active} initialHistory={history} />;
}
