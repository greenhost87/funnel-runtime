"use server";

import { getDatabase } from "@/system/database/connection";
import { BatchEventItemSchema, BatchEventResponseSchema } from "@/system/events/event.schema";
import type { BatchEventInput, BatchEventResult } from "@/system/events/event.types";
import { createEventService } from "@/system/events/event.service";
import { actionErr, actionOk, type ActionResult } from "@/system/http/action-result";
import { getSessionIdFromCookie } from "@/system/http/funnel-api.helpers";
import * as v from "valibot";

export async function postEventBatchAction(
  events: BatchEventInput[],
): Promise<ActionResult<{ results: BatchEventResult[] }>> {
  let items: BatchEventInput[];
  try {
    items = v.parse(v.array(BatchEventItemSchema), events);
  } catch (error) {
    return actionErr(error instanceof Error ? error.message : "Invalid batch payload");
  }

  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) {
    return actionErr("No session");
  }

  const service = createEventService(getDatabase());
  const results = service.processBatch(items, sessionId);
  return actionOk(v.parse(BatchEventResponseSchema, { results }));
}
