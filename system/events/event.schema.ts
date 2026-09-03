import * as v from "valibot";
import type { BatchEventInput } from "./event.types";
import { EventPropertiesSchema } from "./event-properties.schema";
import { validateEventProperties } from "./event-properties.schema";

export const BatchEventItemSchema = v.object({
  eventId: v.string(),
  eventName: v.string(),
  sessionId: v.string(),
  clientTimestamp: v.string(),
  stepId: v.optional(v.nullable(v.string())),
  transitionId: v.optional(v.nullable(v.string())),
  properties: v.optional(EventPropertiesSchema),
});

export const BatchEventSchema = v.object({
  events: v.array(BatchEventItemSchema),
});

const BatchEventResultSchema = v.union([
  v.object({ eventId: v.string(), status: v.literal("accepted") }),
  v.object({ eventId: v.string(), status: v.literal("duplicate") }),
  v.object({ eventId: v.string(), status: v.literal("rejected"), reason: v.string() }),
]);

export const BatchEventResponseSchema = v.object({
  results: v.array(BatchEventResultSchema),
});

export function validateBatchItem(item: BatchEventInput): string | null {
  const propertyError = validateEventProperties(item.properties);
  if (propertyError) {
    return propertyError;
  }
  if (item.eventName === "step_completed" && !item.transitionId) {
    return "step_completed requires transitionId";
  }
  if (item.eventName !== "step_completed" && item.transitionId) {
    return "transitionId is only allowed for step_completed";
  }
  return null;
}
