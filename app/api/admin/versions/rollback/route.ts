import { getDatabase } from "@/system/database/connection";
import { RollbackRequestSchema } from "@/system/funnel/api-response.schema";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";
import { rollbackFunnelVersion } from "@/system/versions/version-mutations";

export const POST = withAdminApiLog(async function POST(request: Request) {
  const body = await parseJsonFromReadable(request, RollbackRequestSchema);

  try {
    return jsonResponse({ active: rollbackFunnelVersion(getDatabase(), body.versionId) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Rollback failed" },
      { status: 400 },
    );
  }
});
