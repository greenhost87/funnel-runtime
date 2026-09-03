import { type NextRequest } from "next/server";
import { getSessionIdFromCookie, handleAnswerMutation } from "@/system/http/funnel-api.helpers";

export async function POST(request: NextRequest) {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return Response.json({ error: "No session" }, { status: 401 });
  }
  const body = (await request.json()) as { stepId?: string; answer?: unknown };
  if (!body.stepId) {
    return Response.json({ error: "stepId is required" }, { status: 400 });
  }
  return handleAnswerMutation(sessionId, body.stepId, body.answer);
}
