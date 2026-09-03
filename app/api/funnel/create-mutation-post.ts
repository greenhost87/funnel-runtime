import type { Database } from "bun:sqlite";
import { getDatabase } from "@/system/database/connection";
import { runSessionMutation } from "@/system/http/funnel-api.helpers";
import { withApiLog } from "@/system/logging/with-api-log";

export function createFunnelMutationPost(handler: (db: Database, sessionId: string) => Response) {
  return withApiLog(async function POST() {
    return runSessionMutation(getDatabase(), handler);
  });
}
