import { getDatabase } from "@/system/database/connection";
import {
  buildApiState,
  getServices,
  getSessionIdFromCookie,
  parseUtmFromSearchParams,
  parseVariantOverride,
  setSessionCookie,
} from "@/system/http/funnel-api.helpers";
import { jsonResponse } from "@/system/http/json";
import { withApiLog } from "@/system/logging/with-api-log";

function createSessionResponse(
  db: ReturnType<typeof getDatabase>,
  existingId: string | undefined,
  searchParams: URLSearchParams,
  options: { alwaysSetCookie: boolean },
) {
  const { sessions } = getServices(db);
  const snapshot = sessions.createOrRestore(existingId ?? null, {
    variantOverride: existingId ? undefined : parseVariantOverride(searchParams),
    utm: existingId ? undefined : parseUtmFromSearchParams(searchParams),
  });
  const response = jsonResponse(buildApiState(db, snapshot));
  if (options.alwaysSetCookie || !existingId || existingId !== snapshot.sessionId) {
    setSessionCookie(response, snapshot.sessionId);
  }
  return response;
}

async function handleSessionRequest(request: Request, alwaysSetCookie: boolean): Promise<Response> {
  const existingId = await getSessionIdFromCookie();
  return createSessionResponse(getDatabase(), existingId, new URL(request.url).searchParams, {
    alwaysSetCookie,
  });
}

export const GET = withApiLog(async function GET(request: Request) {
  return handleSessionRequest(request, false);
});

export const POST = withApiLog(async function POST(request: Request) {
  return handleSessionRequest(request, true);
});
