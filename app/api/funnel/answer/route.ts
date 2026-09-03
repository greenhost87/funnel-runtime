import { getDatabase } from "@/system/database/connection";
import { AnswerRequestSchema } from "@/system/funnel/api-response.schema";
import { getSessionIdFromCookie, handleAnswerMutation } from "@/system/http/funnel-api.helpers";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";
import { withApiLog } from "@/system/logging/with-api-log";

export const POST = withApiLog(async function POST(request: Request) {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return jsonResponse({ error: "No session" }, { status: 401 });
  }
  const body = await parseJsonFromReadable(request, AnswerRequestSchema);
  return handleAnswerMutation(getDatabase(), sessionId, body.stepId, body.answer);
});
