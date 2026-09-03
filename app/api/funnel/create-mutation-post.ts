import type { Database } from "bun:sqlite";
import { getDatabase } from "@/system/database/connection";
import { runSessionMutation } from "@/system/http/funnel-api.helpers";

export function createFunnelMutationPost(
  handler: (db: Database, sessionId: string) => Response,
) {
  return async function POST() {
    return runSessionMutation(getDatabase(), handler);
  };
}
