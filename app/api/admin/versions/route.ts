import { requireAdminApi } from "@/system/auth/require-admin";
import { getDatabase } from "@/system/database/connection";
import { FunnelConfigSchema, parseFunnelConfig } from "@/system/funnel/config.schema";
import { jsonResponse } from "@/system/http/json";
import { createVersionService } from "@/system/versions/version.service";
import * as v from "valibot";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }
  const service = createVersionService(getDatabase());
  const active = service.getActive();
  const history = service.getHistory();
  return jsonResponse({ active, history });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

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
  return jsonResponse({ active });
}
