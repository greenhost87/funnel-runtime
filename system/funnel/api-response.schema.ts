import * as v from "valibot";
import {
  FunnelAnswersSchema,
  FunnelConfigSchema,
  FunnelStepSchema,
  ResultConfigSchema,
  StepAnswerSchema,
} from "./config.schema";

const FunnelVariantSchema = v.union([v.literal("A"), v.literal("B")]);

const EffectiveFunnelConfigSchema = v.object({
  id: v.string(),
  name: v.string(),
  steps: v.array(FunnelStepSchema),
  result: ResultConfigSchema,
  customEvents: v.array(v.string()),
  variant: FunnelVariantSchema,
});

const FunnelSessionStateSchema = v.object({
  currentStepId: v.nullable(v.string()),
  isResult: v.boolean(),
  answers: FunnelAnswersSchema,
  history: v.array(v.string()),
  progress: v.object({
    current: v.number(),
    total: v.number(),
    percent: v.number(),
  }),
});

export const FunnelApiStateSchema = v.object({
  sessionId: v.string(),
  versionId: v.string(),
  variant: FunnelVariantSchema,
  config: EffectiveFunnelConfigSchema,
  state: FunnelSessionStateSchema,
  result: v.nullable(ResultConfigSchema),
  pendingSessionStarted: v.nullable(
    v.object({
      eventId: v.string(),
      eventName: v.literal("session_started"),
    }),
  ),
});

export const MutationResponseSchema = v.intersect([
  FunnelApiStateSchema,
  v.object({
    transitionId: v.optional(v.string()),
  }),
]);

export type FunnelApiState = v.InferOutput<typeof FunnelApiStateSchema>;
export type MutationResponse = v.InferOutput<typeof MutationResponseSchema>;

export const ErrorResponseSchema = v.object({
  error: v.string(),
  details: v.optional(v.array(v.string())),
});

export const AnswerRequestSchema = v.object({
  stepId: v.string(),
  answer: v.optional(StepAnswerSchema),
});

const ActiveVersionSnapshotSchema = v.object({
  versionId: v.string(),
  config: FunnelConfigSchema,
  configId: v.string(),
  createdAt: v.string(),
  activatedAt: v.string(),
});

const ActivationHistoryItemSchema = v.object({
  activationId: v.number(),
  versionId: v.string(),
  configId: v.string(),
  activatedAt: v.string(),
  isActive: v.boolean(),
});

export const VersionsListResponseSchema = v.object({
  active: v.nullable(ActiveVersionSnapshotSchema),
  history: v.array(ActivationHistoryItemSchema),
});

export const RollbackRequestSchema = v.object({
  versionId: v.string(),
});

export const LoginRequestSchema = v.object({
  password: v.string(),
});

const TrafficDateSchema = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));

export const TrafficGenerateRequestSchema = v.object({
  versionId: v.string(),
  sessions: v.optional(v.pipe(v.number(), v.integer(), v.minValue(100))),
  date: v.optional(TrafficDateSchema),
});

export const TrafficGenerateResponseSchema = v.object({
  generatedSessions: v.number(),
});
