import { requireAdminApi } from "@/system/auth/require-admin";
import { getDatabase } from "@/system/database/connection";
import { RollbackRequestSchema } from "@/system/funnel/api-response.schema";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { createVersionService } from "@/system/versions/version.service";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  const body = await parseJsonFromReadable(request, RollbackRequestSchema);

  try {
    const service = createVersionService(getDatabase());
    const active = service.rollbackToVersion(body.versionId);
    return jsonResponse({ active });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Rollback failed" },
      { status: 400 },
    );
  }
}
