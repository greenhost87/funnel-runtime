import { getDatabase } from "@/system/database/connection";
import { AnswerRequestSchema } from "@/system/funnel/api-response.schema";
import { runAnswerSessionMutation } from "@/system/http/funnel-api.helpers";
import { parseJsonFromReadable } from "@/system/http/json";
import { withApiLog } from "@/system/logging/with-api-log";

export const POST = withApiLog(async function POST(request: Request) {
  const body = await parseJsonFromReadable(request, AnswerRequestSchema);
  return runAnswerSessionMutation(getDatabase(), body.stepId, body.answer);
});
