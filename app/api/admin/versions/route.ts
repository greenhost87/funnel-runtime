import { getDatabase } from "@/system/database/connection";
import { FunnelConfigSchema, parseFunnelConfig } from "@/system/funnel/config.schema";
import { jsonResponse } from "@/system/http/json";
import { logger } from "@/system/logging/logger";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";
import { createVersionService } from "@/system/versions/version.service";
import * as v from "valibot";

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

  let config;
  try {
    config = parseFunnelConfig(
      v.parse(v.pipe(v.string(), v.parseJson(), FunnelConfigSchema), await file.text()),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid config";
    return jsonResponse({ error: message }, { status: 400 });
  }

  const service = createVersionService(getDatabase());
  const active = service.publish(config);
  logger.info("admin.versions.publish", { versionId: active.versionId, configId: active.configId });
  return jsonResponse({ active });
});
