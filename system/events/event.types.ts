export const REQUIRED_EVENT_NAMES = [
  "session_started",
  "step_viewed",
  "answer_submitted",
  "step_completed",
  "back_clicked",
  "result_viewed",
  "cta_clicked",
] as const;

export type RequiredEventName = (typeof REQUIRED_EVENT_NAMES)[number];

export type EventName = RequiredEventName | string;

export type BatchEventInput = {
  eventId: string;
  eventName: EventName;
  sessionId: string;
  clientTimestamp: string;
  stepId?: string | null;
  transitionId?: string | null;
  properties?: Record<string, unknown>;
};

export type BatchEventResult =
  | { eventId: string; status: "accepted" }
  | { eventId: string; status: "duplicate" }
  | { eventId: string; status: "rejected"; reason: string };

export type StoredEvent = {
  eventId: string;
  sessionId: string;
  eventName: string;
  serverTimestamp: string;
  clientTimestamp: string;
  versionId: string;
  variant: string;
  stepId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  transitionId: string | null;
  properties: Record<string, unknown>;
};

const FORBIDDEN_PROPERTY_KEYS = ["answer", "answers", "rawAnswer", "rawAnswers", "value"];

export function sanitizeEventProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!properties) {
    return {};
  }
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_PROPERTY_KEYS.includes(key)) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function isRequiredEventName(name: string): name is RequiredEventName {
  return (REQUIRED_EVENT_NAMES as readonly string[]).includes(name);
}
