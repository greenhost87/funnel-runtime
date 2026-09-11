import { getDatabase } from "@/system/database/connection";
import { TrafficGenerateRequestSchema } from "@/system/funnel/api-response.schema";
import { runTrafficGeneration } from "@/system/generator/run-traffic-generation";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { withAdminApiLog } from "@/system/logging/with-admin-api-log";

export const POST = withAdminApiLog(async function POST(request: Request) {
  let body;
  try {
    body = await parseJsonFromReadable(request, TrafficGenerateRequestSchema);
  } catch {
    return jsonResponse({ error: "Invalid request" }, { status: 400 });
  }

  const result = await runTrafficGeneration(getDatabase(), body);
  if (!result.ok) {
    return jsonResponse({ error: result.error }, { status: 400 });
  }
  return jsonResponse({ generatedSessions: result.generatedSessions });
});
