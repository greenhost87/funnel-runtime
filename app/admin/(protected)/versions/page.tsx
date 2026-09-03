import { getDatabase } from "@/system/database/connection";
import { createVersionService } from "@/system/versions/version.service";
import { VersionsClient } from "@/app/admin/(protected)/versions/versions.client";

function getVersionsPageData() {
  const service = createVersionService(getDatabase());
  return {
    active: service.getActive(),
    history: service.getHistory(),
  };
}

export default function VersionsPage() {
  const { active, history } = getVersionsPageData();
  return <VersionsClient initialActive={active} initialHistory={history} />;
}
