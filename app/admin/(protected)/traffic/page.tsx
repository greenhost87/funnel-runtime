import { TrafficClient } from "@/app/admin/(protected)/traffic/traffic.client";
import { getVersionAdminData } from "@/app/admin/get-version-admin-data";

export default function TrafficPage() {
  const { active, history } = getVersionAdminData();
  return <TrafficClient versions={history} activeVersionId={active?.versionId ?? null} />;
}
