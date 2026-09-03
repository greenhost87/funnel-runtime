import { getDatabase } from "@/system/database/connection";
import { createVersionService } from "@/system/versions/version.service";

export function getVersionAdminData() {
  const service = createVersionService(getDatabase());
  return {
    active: service.getActive(),
    history: service.getHistory(),
  };
}
