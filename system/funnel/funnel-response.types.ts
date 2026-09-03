import type {
  EffectiveFunnelConfig,
  FunnelSessionState,
  FunnelVariant,
} from "@/system/funnel/config.types";

export type PendingSessionStartedIntent = {
  eventId: string;
  eventName: "session_started";
};

export type FunnelApiState = {
  sessionId: string;
  versionId: string;
  variant: FunnelVariant;
  config: EffectiveFunnelConfig;
  state: FunnelSessionState;
  result: EffectiveFunnelConfig["result"] | null;
  pendingSessionStarted: PendingSessionStartedIntent | null;
};

export type MutationResponse = FunnelApiState & {
  transitionId?: string;
};

export type FunnelApiError = {
  error: string;
  details?: string[];
};
