import { NextResponse, type NextRequest } from "next/server";
import {
  buildApiState,
  getServices,
  getSessionIdFromCookie,
  parseUtmFromSearchParams,
  parseVariantOverride,
  setSessionCookie,
} from "@/system/http/funnel-api.helpers";

export async function GET(request: NextRequest) {
  const { sessions } = getServices();
  const existingId = await getSessionIdFromCookie();
  const searchParams = request.nextUrl.searchParams;
  const snapshot = sessions.createOrRestore(existingId ?? null, {
    variantOverride: existingId ? undefined : parseVariantOverride(searchParams),
    utm: existingId ? undefined : parseUtmFromSearchParams(searchParams),
  });
  const response = NextResponse.json(buildApiState(snapshot));
  if (!existingId || existingId !== snapshot.sessionId) {
    setSessionCookie(response, snapshot.sessionId);
  }
  return response;
}

export async function POST(request: NextRequest) {
  const { sessions } = getServices();
  const existingId = await getSessionIdFromCookie();
  const searchParams = request.nextUrl.searchParams;
  const snapshot = sessions.createOrRestore(existingId ?? null, {
    variantOverride: existingId ? undefined : parseVariantOverride(searchParams),
    utm: existingId ? undefined : parseUtmFromSearchParams(searchParams),
  });
  const response = NextResponse.json(buildApiState(snapshot));
  setSessionCookie(response, snapshot.sessionId);
  return response;
}
