import { getSessionIdFromCookie, handleBackMutation } from "@/system/http/funnel-api.helpers";

export async function POST() {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return Response.json({ error: "No session" }, { status: 401 });
  }
  return handleBackMutation(sessionId);
}
