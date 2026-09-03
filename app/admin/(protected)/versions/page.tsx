import { getDatabase } from "@/system/database/connection";
import { VersionService } from "@/system/versions/version.service";
import { VersionsClient } from "@/app/admin/(protected)/versions/versions.client";

export default async function VersionsPage() {
  const service = new VersionService(getDatabase());
  const active = service.getActive();
  const history = service.getHistory();

  return <VersionsClient initialActive={active} initialHistory={history} />;
}
