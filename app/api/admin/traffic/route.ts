import { getDatabase } from "@/system/database/connection";
import { TrafficGenerateRequestSchema } from "@/system/funnel/api-response.schema";
import { generateSyntheticTraffic } from "@/system/generator/traffic-generator";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { logger } from "@/system/logging/logger";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";
import { createVersionService } from "@/system/versions/version.service";

export const POST = withAdminApiLog(async function POST(request: Request) {
  let body;
  try {
    body = await parseJsonFromReadable(request, TrafficGenerateRequestSchema);
  } catch {
    return jsonResponse({ error: "Invalid request" }, { status: 400 });
  }

  const sessionCount = body.sessions ?? 120;
  const versions = createVersionService(getDatabase());
  if (!versions.getHistory().some((item) => item.versionId === body.versionId)) {
    return jsonResponse({ error: "Unknown funnel version" }, { status: 400 });
  }

  const { generatedSessions } = generateSyntheticTraffic(getDatabase(), {
    versionId: body.versionId,
    sessionCount,
    anchorDate: body.date,
  });

  logger.info("admin.traffic.generate", {
    versionId: body.versionId,
    generatedSessions,
    date: body.date,
  });
  return jsonResponse({ generatedSessions });
});
