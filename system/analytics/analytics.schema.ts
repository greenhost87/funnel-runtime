import * as v from "valibot";

const AnalyticsFiltersSchema = v.object({
  utmCampaign: v.optional(v.string()),
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
  campaigns: v.array(v.string()),
});
