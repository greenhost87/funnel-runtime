import * as v from "valibot";
import { FUNNEL_VARIANTS } from "@/system/funnel/config.types";

const AnalyticsDateSchema = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));

const AnalyticsFiltersSchema = v.object({
  utmCampaign: v.optional(v.string()),
  variant: v.optional(v.picklist(FUNNEL_VARIANTS)),
  versionId: v.optional(v.string()),
  dateFrom: v.optional(AnalyticsDateSchema),
  dateTo: v.optional(AnalyticsDateSchema),
});

const EdgeMetricSchema = v.object({
  versionId: v.string(),
  variant: v.string(),
  fromStepId: v.string(),
  toStepId: v.nullable(v.string()),
  toResult: v.boolean(),
  completions: v.number(),
  views: v.number(),
  conversionRate: v.nullable(v.number()),
  dropOffRate: v.nullable(v.number()),
});

const AnalyticsSummarySchema = v.object({
  sessionsStarted: v.number(),
  primaryCtaFromStartConversion: v.nullable(v.number()),
  resultReachRate: v.nullable(v.number()),
  ctaCtr: v.nullable(v.number()),
  filters: AnalyticsFiltersSchema,
});

export const AnalyticsDashboardSchema = v.object({
  summary: AnalyticsSummarySchema,
  edges: v.array(EdgeMetricSchema),
  comparisons: v.array(
    v.object({
      versionId: v.string(),
      variant: v.string(),
      started: v.number(),
      primaryCtaFromStartConversion: v.nullable(v.number()),
      resultReachRate: v.nullable(v.number()),
      ctaCtr: v.nullable(v.number()),
    }),
  ),
  stepFunnel: v.array(
    v.object({
      versionId: v.string(),
      variant: v.string(),
      stepId: v.string(),
      views: v.number(),
      completions: v.number(),
    }),
  ),
  sessionsByDay: v.array(
    v.object({
      date: v.string(),
      sessions: v.number(),
    }),
  ),
  campaigns: v.array(v.string()),
  versions: v.array(
    v.object({
      versionId: v.string(),
      name: v.string(),
    }),
  ),
  labels: v.object({
    versions: v.record(v.string(), v.string()),
    steps: v.record(v.string(), v.string()),
  }),
});
