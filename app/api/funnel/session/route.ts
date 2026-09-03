import { type NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  const existingId = await getSessionIdFromCookie();
  return createSessionResponse(getDatabase(), existingId, request.nextUrl.searchParams, {
    alwaysSetCookie: false,
  });
}

export async function POST(request: NextRequest) {
  const existingId = await getSessionIdFromCookie();
  return createSessionResponse(getDatabase(), existingId, request.nextUrl.searchParams, {
    alwaysSetCookie: true,
  });
}
