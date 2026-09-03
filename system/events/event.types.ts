import type { EventProperties } from "./event-properties.schema";
import type { FunnelVariant } from "@/system/funnel/config.types";

export type EventName = string;

export interface EventAttributionFields {
  stepId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  transitionId?: string | null;
}

export type BatchEventInput = {
  eventId: string;
  eventName: EventName;
  sessionId: string;
  clientTimestamp: string;
  stepId?: string | null;
  transitionId?: string | null;
  properties?: EventProperties;
};

export type BatchEventResult =
  | { eventId: string; status: "accepted" }
  | { eventId: string; status: "duplicate" }
  | { eventId: string; status: "rejected"; reason: string };

export interface InsertEventInput extends EventAttributionFields {
  eventId: string;
  sessionId: string;
  eventName: string;
  clientTimestamp: string;
  versionId: string;
  variant: FunnelVariant;
  properties: EventProperties;
}

export interface StoredEvent extends EventAttributionFields {
  eventId: string;
  sessionId: string;
  eventName: string;
  serverTimestamp: string;
  clientTimestamp: string;
  versionId: string;
  variant: string;
  properties: EventProperties;
}
