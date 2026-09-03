import { getDatabase } from "@/system/database/connection";
import { RollbackRequestSchema } from "@/system/funnel/api-response.schema";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { logger } from "@/system/logging/logger";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";
import { createVersionService } from "@/system/versions/version.service";

export const POST = withAdminApiLog(async function POST(request: Request) {
  const body = await parseJsonFromReadable(request, RollbackRequestSchema);

  try {
    const service = createVersionService(getDatabase());
    const active = service.rollbackToVersion(body.versionId);
    logger.info("admin.versions.rollback", { versionId: active.versionId });
    return jsonResponse({ active });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Rollback failed" },
      { status: 400 },
    );
  }
});
