import type { BatchEventInput, BatchEventResult } from "@/system/events/event.types";

const pendingEvents = new Map<string, BatchEventInput>();

function storageKey(eventId: string): string {
  return `funnel-event:${eventId}`;
}

export function rememberEventIntent(event: BatchEventInput): void {
  pendingEvents.set(event.eventId, event);
  if (typeof window !== "undefined") {
    sessionStorage.setItem(storageKey(event.eventId), JSON.stringify(event));
  }
}

export function loadStoredEventIntent(eventId: string): BatchEventInput | null {
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
  return JSON.parse(raw) as BatchEventInput;
}

export function clearEventIntent(eventId: string): void {
  pendingEvents.delete(eventId);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(storageKey(eventId));
  }
}

export async function sendEventBatch(events: BatchEventInput[]): Promise<BatchEventResult[]> {
  for (const event of events) {
    rememberEventIntent(event);
  }
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!response.ok) {
    throw new Error("Event batch failed");
  }
  const payload = (await response.json()) as { results: BatchEventResult[] };
  for (const result of payload.results) {
    if (result.status === "accepted" || result.status === "duplicate") {
      clearEventIntent(result.eventId);
    }
  }
  return payload.results;
}

export async function sendEventWithRetry(event: BatchEventInput): Promise<BatchEventResult> {
  rememberEventIntent(event);
  try {
    const [result] = await sendEventBatch([event]);
    return result ?? { eventId: event.eventId, status: "rejected", reason: "No result" };
  } catch {
    const stored = loadStoredEventIntent(event.eventId) ?? event;
    const [result] = await sendEventBatch([stored]);
    return result ?? { eventId: event.eventId, status: "rejected", reason: "Retry failed" };
  }
}

export function createEventIntent(
  input: Omit<BatchEventInput, "clientTimestamp">,
): BatchEventInput {
  return {
    ...input,
    clientTimestamp: new Date().toISOString(),
  };
}

export function createEventId(): string {
  return crypto.randomUUID();
}
