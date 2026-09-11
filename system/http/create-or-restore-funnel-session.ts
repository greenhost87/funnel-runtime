import type { Database } from "bun:sqlite";
import {
  buildApiState,
  getServices,
  parseUtmFromSearchParams,
  parseVariantOverride,
} from "@/system/http/funnel-api.helpers";
import type { FunnelApiState } from "@/system/funnel/api-response.schema";

export function createOrRestoreFunnelSession(
  db: Database,
  existingId: string | undefined,
  searchParams: URLSearchParams,
): { snapshotSessionId: string; state: FunnelApiState; shouldSetCookie: boolean } {
  const { sessions } = getServices(db);
  const snapshot = sessions.createOrRestore(existingId ?? null, {
    variantOverride: existingId ? undefined : parseVariantOverride(searchParams),
    utm: existingId ? undefined : parseUtmFromSearchParams(searchParams),
  });
  return {
    snapshotSessionId: snapshot.sessionId,
    state: buildApiState(db, snapshot),
    shouldSetCookie: !existingId || existingId !== snapshot.sessionId,
  };
}
