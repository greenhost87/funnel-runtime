import { getDatabase } from "@/system/database/connection";
import { createOrRestoreFunnelSession } from "@/system/http/create-or-restore-funnel-session";
import { getSessionIdFromCookie, setSessionCookie } from "@/system/http/funnel-api.helpers";
import { jsonResponse } from "@/system/http/json";
import { withApiLog } from "@/system/logging/with-api-log";

function createSessionResponse(
  existingId: string | undefined,
  searchParams: URLSearchParams,
  options: { alwaysSetCookie: boolean },
) {
  const restored = createOrRestoreFunnelSession(getDatabase(), existingId, searchParams);
  const response = jsonResponse(restored.state);
  if (options.alwaysSetCookie || restored.shouldSetCookie) {
    setSessionCookie(response, restored.snapshotSessionId);
  }
  return response;
}

async function handleSessionRequest(request: Request, alwaysSetCookie: boolean): Promise<Response> {
  const existingId = await getSessionIdFromCookie();
  return createSessionResponse(existingId, new URL(request.url).searchParams, {
    alwaysSetCookie,
  });
}

export const GET = withApiLog(async function GET(request: Request) {
  return handleSessionRequest(request, false);
});

export const POST = withApiLog(async function POST(request: Request) {
  return handleSessionRequest(request, true);
});
