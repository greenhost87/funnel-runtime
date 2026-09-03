import type { Database } from "bun:sqlite";
import * as v from "valibot";
import { createAnalyticsDao, type AnalyticsFilters } from "@/system/database/analytics/analytics.dao";

export type EdgeMetric = {
  versionId: string;
  variant: string;
  fromStepId: string;
  toStepId: string | null;
  toResult: boolean;
  completions: number;
  views: number;
  conversionRate: number | null;
  dropOffRate: number | null;
};

export type AnalyticsSummary = {
  sessionsStarted: number;
  primaryCtaFromStartConversion: number | null;
  resultReachRate: number | null;
  ctaCtr: number | null;
  filters: AnalyticsFilters;
};

export type AnalyticsDashboard = {
  summary: AnalyticsSummary;
  edges: EdgeMetric[];
  comparisons: Array<{
    versionId: string;
    variant: string;
    started: number;
    primaryCtaFromStartConversion: number | null;
    resultReachRate: number | null;
    ctaCtr: number | null;
  }>;
  campaigns: string[];
};

const CampaignRowSchema = v.object({
  campaign: v.string(),
});

export function createAnalyticsService(db: Database) {
  const dao = createAnalyticsDao(db);

  function listCampaigns(): string[] {
    const rows = db
      .query(
        `SELECT DISTINCT utm_campaign AS campaign FROM events WHERE utm_campaign IS NOT NULL ORDER BY campaign`,
      )
      .all();
    return rows.flatMap((row) => {
      const parsed = v.safeParse(CampaignRowSchema, row);
      return parsed.success ? [parsed.output.campaign] : [];
    });
  }

  function getDashboard(filters: AnalyticsFilters = {}): AnalyticsDashboard {
    const started = dao.countDistinctSessionsStarted(filters);
    const ctaClicked = dao.countDistinctSessionsWithCta(filters);
    const resultViewed = dao.countDistinctSessionsReachedResult(filters);

    const summary: AnalyticsSummary = {
      sessionsStarted: started,
      primaryCtaFromStartConversion: safeRate(ctaClicked, started),
      resultReachRate: safeRate(resultViewed, started),
      ctaCtr: safeRate(ctaClicked, resultViewed),
      filters,
    };

    const views = dao.listStepViews(filters);
    const completions = dao.listCompletionEdges(filters);
    const completionByFrom = dao.listCompletionsByFromStep(filters);

    const viewMap = new Map<string, number>();
    for (const view of views) {
      viewMap.set(`${view.versionId}:${view.variant}:${view.stepId}`, view.sessionCount);
    }
    const completionFromMap = new Map<string, number>();
    for (const row of completionByFrom) {
      completionFromMap.set(`${row.versionId}:${row.variant}:${row.fromStepId}`, row.sessionCount);
    }

    const edges: EdgeMetric[] = completions.map((edge) => {
      const viewsForStep = viewMap.get(`${edge.versionId}:${edge.variant}:${edge.fromStepId}`) ?? 0;
      const completionsForStep =
        completionFromMap.get(`${edge.versionId}:${edge.variant}:${edge.fromStepId}`) ?? 0;
      return {
        versionId: edge.versionId,
        variant: edge.variant,
        fromStepId: edge.fromStepId,
        toStepId: edge.toStepId,
        toResult: edge.toResult,
        completions: edge.sessionCount,
        views: viewsForStep,
        conversionRate: safeRate(edge.sessionCount, viewsForStep),
        dropOffRate: safeRate(Math.max(viewsForStep - completionsForStep, 0), viewsForStep),
      };
    });

    const comparisons = dao.listVersionVariantBreakdown(filters).map((row) => ({
      versionId: row.versionId,
      variant: row.variant,
      started: row.started,
      primaryCtaFromStartConversion: safeRate(row.ctaClicked, row.started),
      resultReachRate: safeRate(row.resultViewed, row.started),
      ctaCtr: safeRate(row.ctaClicked, row.resultViewed),
    }));

    return {
      summary,
      edges,
      comparisons,
      campaigns: listCampaigns(),
    };
  }

  return { getDashboard };
}

function safeRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return numerator / denominator;
}
