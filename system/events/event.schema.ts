import * as v from "valibot";
import type { BatchEventInput } from "./event.types";

const BatchEventItemSchema = v.object({
  eventId: v.string(),
  eventName: v.string(),
  sessionId: v.string(),
  clientTimestamp: v.string(),
  stepId: v.optional(v.nullable(v.string())),
  transitionId: v.optional(v.nullable(v.string())),
  properties: v.optional(v.record(v.string(), v.unknown())),
});

export const BatchEventSchema = v.object({
  events: v.array(BatchEventItemSchema),
});

export function parseBatchEvents(input: unknown): BatchEventInput[] {
  const parsed = v.parse(BatchEventSchema, input);
  return parsed.events;
}

export function validateBatchItem(item: BatchEventInput): string | null {
  if (item.properties) {
    for (const key of ["answer", "answers", "rawAnswer", "rawAnswers", "value"]) {
      if (key in item.properties) {
        return `Raw answer fields are not allowed in event properties (${key})`;
      }
    }
  }
  if (item.eventName === "step_completed" && !item.transitionId) {
    return "step_completed requires transitionId";
  }
  if (item.eventName !== "step_completed" && item.transitionId) {
    return "transitionId is only allowed for step_completed";
  }
  return null;
}
