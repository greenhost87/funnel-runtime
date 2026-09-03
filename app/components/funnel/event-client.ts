import { withBasePath } from "@/system/config/base-path";
import { BatchEventItemSchema, BatchEventResponseSchema } from "@/system/events/event.schema";
import type { BatchEventInput, BatchEventResult } from "@/system/events/event.types";
import type { EventProperties } from "@/system/events/event-properties.schema";
import { parseJsonFromReadable } from "@/system/http/json";
import * as v from "valibot";

export type EventIntentInput = {
  eventId: string;
  eventName: string;
  sessionId: string;
  stepId?: string | null;
  transitionId?: string | null;
  properties?: EventProperties;
};

const pendingEvents = new Map<string, BatchEventInput>();

function storageKey(eventId: string): string {
  return `funnel-event:${eventId}`;
}

function rememberEventIntent(event: BatchEventInput): void {
  pendingEvents.set(event.eventId, event);
  if (typeof window !== "undefined") {
    sessionStorage.setItem(storageKey(event.eventId), JSON.stringify(event));
  }
}

function loadStoredEventIntent(eventId: string): BatchEventInput | null {
  const cached = pendingEvents.get(eventId);
  if (cached) {
    return cached;
  }
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(storageKey(eventId));
  if (!raw) {
    return null;
  }
  const result = v.safeParse(v.pipe(v.string(), v.parseJson(), BatchEventItemSchema), raw);
  return result.success ? result.output : null;
}

function clearEventIntent(eventId: string): void {
  pendingEvents.delete(eventId);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(storageKey(eventId));
  }
}

async function postEventBatch(events: BatchEventInput[]): Promise<BatchEventResult[]> {
  const response = await fetch(withBasePath("/api/events"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!response.ok) {
    throw new Error("Event batch failed");
  }
  const payload = await parseJsonFromReadable(response, BatchEventResponseSchema);
  for (const result of payload.results) {
    clearEventIntent(result.eventId);
  }
  return payload.results;
}

function pendingEventIntents(sessionId: string): BatchEventInput[] {
  const collected = new Map<string, BatchEventInput>();
  for (const event of pendingEvents.values()) {
    if (event.sessionId === sessionId) {
      collected.set(event.eventId, event);
    }
  }
  if (typeof window === "undefined") {
    return [...collected.values()];
  }
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (!key?.startsWith("funnel-event:")) {
      continue;
    }
    const event = loadStoredEventIntent(key.slice("funnel-event:".length));
    if (event?.sessionId === sessionId) {
      collected.set(event.eventId, event);
    }
  }
  return [...collected.values()];
}

export async function sendEventBatch(events: BatchEventInput[]): Promise<BatchEventResult[]> {
  for (const event of events) {
    rememberEventIntent(event);
  }
  try {
    return await postEventBatch(events);
  } catch {
    const retryEvents = events.map((event) => loadStoredEventIntent(event.eventId) ?? event);
    return postEventBatch(retryEvents);
  }
}

export async function retryPendingEvents(sessionId: string): Promise<void> {
  const events = pendingEventIntents(sessionId);
  if (events.length === 0) {
    return;
  }
  try {
    await sendEventBatch(events);
  } catch {
    // Intents remain in sessionStorage for the next page load.
  }
}

export async function sendEventWithRetry(event: BatchEventInput): Promise<BatchEventResult> {
  const [result] = await sendEventBatch([event]);
  return result ?? { eventId: event.eventId, status: "rejected", reason: "No result" };
}

export function createEventIntent(input: EventIntentInput): BatchEventInput {
  return {
    ...input,
    clientTimestamp: new Date().toISOString(),
  };
}

export function createEventId(): string {
  return crypto.randomUUID();
}
