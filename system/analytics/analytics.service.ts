import type { Database } from "bun:sqlite";
import * as v from "valibot";
import {
  createAnalyticsDao,
  type AnalyticsFilters,
} from "@/system/database/analytics/analytics.dao";
import { readRows } from "@/system/database/read-row";

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

export type StepFunnelMetric = {
  versionId: string;
  variant: string;
  stepId: string;
  views: number;
  completions: number;
};

export type SessionsByDayMetric = {
  date: string;
  sessions: number;
};

export type AnalyticsComparison = {
  versionId: string;
  variant: string;
  started: number;
  primaryCtaFromStartConversion: number | null;
  resultReachRate: number | null;
  ctaCtr: number | null;
};

export type AnalyticsDashboard = {
  summary: AnalyticsSummary;
  edges: EdgeMetric[];
  comparisons: AnalyticsComparison[];
  stepFunnel: StepFunnelMetric[];
  sessionsByDay: SessionsByDayMetric[];
  campaigns: string[];
  versions: string[];
};

const CampaignRowSchema = v.object({
  campaign: v.string(),
});

const VersionRowSchema = v.object({
  versionId: v.string(),
});

function mapValidatedRows<TSchema extends v.GenericSchema>(
  db: Database,
  sql: string,
  schema: TSchema,
  mapRow: (row: v.InferOutput<TSchema>) => string,
): string[] {
  return readRows(db, sql, [], schema).map(mapRow);
}

export function createAnalyticsService(db: Database) {
  const dao = createAnalyticsDao(db);

  function listCampaigns(): string[] {
    return mapValidatedRows(
      db,
      `SELECT DISTINCT utm_campaign AS campaign FROM events WHERE utm_campaign IS NOT NULL ORDER BY campaign`,
      CampaignRowSchema,
      (row) => row.campaign,
    );
  }

  function listVersions(): string[] {
    return mapValidatedRows(
      db,
      `SELECT DISTINCT version_id AS versionId FROM events ORDER BY version_id`,
      VersionRowSchema,
      (row) => row.versionId,
    );
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

    const stepFunnel = buildStepFunnel(views, completionByFrom);
    const sessionsByDay = dao.listSessionsStartedByDay(filters);

    return {
      summary,
      edges,
      comparisons,
      stepFunnel,
      sessionsByDay,
      campaigns: listCampaigns(),
      versions: listVersions(),
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

function buildStepFunnel(
  views: Array<{ versionId: string; variant: string; stepId: string; sessionCount: number }>,
  completions: Array<{
    versionId: string;
    variant: string;
    fromStepId: string;
    sessionCount: number;
  }>,
): StepFunnelMetric[] {
  const viewsByKey = new Map<string, number>();
  for (const view of views) {
    const key = `${view.versionId}:${view.variant}:${view.stepId}`;
    viewsByKey.set(key, (viewsByKey.get(key) ?? 0) + view.sessionCount);
  }

  const completionsByKey = new Map<string, number>();
  for (const row of completions) {
    const key = `${row.versionId}:${row.variant}:${row.fromStepId}`;
    completionsByKey.set(key, (completionsByKey.get(key) ?? 0) + row.sessionCount);
  }

  const keys = new Set([...viewsByKey.keys(), ...completionsByKey.keys()]);
  return [...keys]
    .map((key) => {
      const [versionId, variant, stepId] = key.split(":");
      return {
        versionId: versionId ?? "",
        variant: variant ?? "",
        stepId: stepId ?? "",
        views: viewsByKey.get(key) ?? 0,
        completions: completionsByKey.get(key) ?? 0,
      };
    })
    .sort((left, right) => {
      if (right.views !== left.views) {
        return right.views - left.views;
      }
      if (left.versionId !== right.versionId) {
        return left.versionId.localeCompare(right.versionId);
      }
      if (left.variant !== right.variant) {
        return left.variant.localeCompare(right.variant);
      }
      return left.stepId.localeCompare(right.stepId);
    });
}
