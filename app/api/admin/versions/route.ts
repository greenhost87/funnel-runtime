import { getDatabase } from "@/system/database/connection";
import { jsonResponse } from "@/system/http/json";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";
import { createVersionService } from "@/system/versions/version.service";
import {
  parseFunnelConfigUpload,
  publishParsedFunnelConfig,
} from "@/system/versions/version-mutations";

export const GET = withAdminApiLog(function GET() {
  const service = createVersionService(getDatabase());
  const active = service.getActive();
  const history = service.getHistory();
  return jsonResponse({ active, history });
});

export const POST = withAdminApiLog(async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("config");
  if (!(file instanceof File)) {
    return jsonResponse({ error: "config file is required" }, { status: 400 });
  }

  try {
    const config = await parseFunnelConfigUpload(file);
    return jsonResponse({ active: publishParsedFunnelConfig(getDatabase(), config) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid config";
    return jsonResponse({ error: message }, { status: 400 });
  }
});
