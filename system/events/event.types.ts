import type { EventProperties } from "./event-properties.schema";
import type { FunnelVariant } from "@/system/funnel/config.types";

export type EventName = string;

export interface EventAttributionFields {
  stepId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  transitionId?: string;
}

export type BatchEventInput = {
  eventId: string;
  eventName: EventName;
  sessionId: string;
  clientTimestamp: string;
  stepId?: string;
  transitionId?: string;
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
