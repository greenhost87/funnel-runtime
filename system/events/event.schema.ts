import * as v from "valibot";
import type { BatchEventInput } from "./event.types";
import { EventPropertiesSchema, EventPropertyValueSchema } from "./event-properties.schema";
import { validateEventProperties } from "./event-properties.schema";

const OptionalAbsentStringSchema = v.pipe(
  v.optional(v.nullable(v.string())),
  v.transform((value) => value ?? undefined),
);

export const BatchEventItemSchema = v.object({
  eventId: v.string(),
  eventName: v.string(),
  sessionId: v.string(),
  clientTimestamp: v.string(),
  stepId: OptionalAbsentStringSchema,
  transitionId: OptionalAbsentStringSchema,
  properties: v.optional(EventPropertiesSchema),
});

export const BatchEventSchema = v.object({
  events: v.array(EventPropertyValueSchema),
});

const BatchEventResultSchema = v.union([
  v.object({ eventId: v.string(), status: v.literal("accepted") }),
  v.object({ eventId: v.string(), status: v.literal("duplicate") }),
  v.object({ eventId: v.string(), status: v.literal("rejected"), reason: v.string() }),
]);

export const BatchEventResponseSchema = v.object({
  results: v.array(BatchEventResultSchema),
});

const EVENTS_REQUIRING_STEP = new Set([
  "step_viewed",
  "answer_submitted",
  "step_completed",
  "back_clicked",
]);

export function validateBatchItem(item: BatchEventInput): string | null {
  const propertyError = validateEventProperties(item.properties);
  if (propertyError) {
    return propertyError;
  }
  if (EVENTS_REQUIRING_STEP.has(item.eventName) && !item.stepId) {
    return `${item.eventName} requires stepId`;
  }
  if (item.eventName === "step_completed" && !item.transitionId) {
    return "step_completed requires transitionId";
  }
  if (item.eventName !== "step_completed" && item.transitionId) {
    return "transitionId is only allowed for step_completed";
  }
  return null;
}
