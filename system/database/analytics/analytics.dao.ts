import { readRows } from "@/system/database/read-row";
import type { Database } from "bun:sqlite";
import * as v from "valibot";
import { FUNNEL_VARIANTS, type FunnelVariant } from "@/system/funnel/config.types";

export type AnalyticsFilters = {
  utmCampaign?: string;
};

type CompletionEdgeRow = {
  versionId: string;
  variant: FunnelVariant;
  fromStepId: string;
  toStepId: string | null;
  toResult: boolean;
  sessionCount: number;
};

type StepViewRow = {
  versionId: string;
  variant: FunnelVariant;
  stepId: string;
  sessionCount: number;
};

type CompletionByFromStepRow = {
  versionId: string;
  variant: FunnelVariant;
  fromStepId: string;
  sessionCount: number;
};

type VersionVariantBreakdownRow = {
  versionId: string;
  variant: FunnelVariant;
  started: number;
  ctaClicked: number;
  resultViewed: number;
};

const CompletionEdgeRowSchema = v.object({
  versionId: v.string(),
  variant: v.picklist(FUNNEL_VARIANTS),
  fromStepId: v.string(),
  toStepId: v.nullable(v.string()),
  toResult: v.number(),
  sessionCount: v.number(),
});

const StepViewRowSchema = v.object({
  versionId: v.string(),
  variant: v.picklist(FUNNEL_VARIANTS),
  stepId: v.string(),
  sessionCount: v.number(),
});

const CompletionByFromStepRowSchema = v.object({
  versionId: v.string(),
  variant: v.picklist(FUNNEL_VARIANTS),
  fromStepId: v.string(),
  sessionCount: v.number(),
});

const VersionVariantBreakdownRowSchema = v.object({
  versionId: v.string(),
  variant: v.picklist(FUNNEL_VARIANTS),
  started: v.number(),
  ctaClicked: v.number(),
  resultViewed: v.number(),
});

const CountRowSchema = v.object({
  count: v.number(),
});

function campaignClause(
  alias: string,
  filters: AnalyticsFilters,
): { clause: string; params: string[] } {
  if (!filters.utmCampaign) {
    return { clause: "", params: [] };
  }
  const prefix = alias ? `${alias}.` : "";
  return { clause: `AND ${prefix}utm_campaign = ?`, params: [filters.utmCampaign] };
}

function mapCompletionEdgeRow(
  row: v.InferOutput<typeof CompletionEdgeRowSchema>,
): CompletionEdgeRow {
  return {
    versionId: row.versionId,
    variant: row.variant,
    fromStepId: row.fromStepId,
    toStepId: row.toStepId,
    toResult: row.toResult === 1,
    sessionCount: row.sessionCount,
  };
}

export function createAnalyticsDao(db: Database) {
  function listAggregated<const TSchema extends v.GenericSchema>(
    schema: TSchema,
    alias: string,
    sql: string,
    filters: AnalyticsFilters,
  ): v.InferOutput<TSchema>[] {
    const { clause, params } = campaignClause(alias, filters);
    return readRows(db, sql.replace("{{clause}}", clause), params, schema);
  }

  function countDistinctEvent(eventName: string, filters: AnalyticsFilters): number {
    const { clause, params } = campaignClause("", filters);
    const row = db
      .query(`SELECT COUNT(DISTINCT session_id) AS count FROM events WHERE event_name = ? ${clause}`)
      .get(eventName, ...params);
    const parsed = v.safeParse(CountRowSchema, row);
    return parsed.success ? parsed.output.count : 0;
  }

  function listCompletionEdges(filters: AnalyticsFilters): CompletionEdgeRow[] {
    return listAggregated(
      CompletionEdgeRowSchema,
      "e",
      `
        SELECT
          t.version_id AS versionId,
          t.variant AS variant,
          t.from_step_id AS fromStepId,
          t.to_step_id AS toStepId,
          t.to_result AS toResult,
          COUNT(DISTINCT e.session_id) AS sessionCount
        FROM events e
        INNER JOIN session_transitions t ON t.transition_id = e.transition_id
        WHERE e.event_name = 'step_completed' {{clause}}
        GROUP BY t.version_id, t.variant, t.from_step_id, t.to_step_id, t.to_result
      `,
      filters,
    ).map(mapCompletionEdgeRow);
  }

  function listStepViews(filters: AnalyticsFilters): StepViewRow[] {
    return listAggregated(
      StepViewRowSchema,
      "e",
      `
        SELECT version_id AS versionId, variant, step_id AS stepId,
               COUNT(DISTINCT session_id) AS sessionCount
        FROM events e
        WHERE event_name = 'step_viewed' AND step_id IS NOT NULL {{clause}}
        GROUP BY version_id, variant, step_id
      `,
      filters,
    );
  }

  function listCompletionsByFromStep(filters: AnalyticsFilters): CompletionByFromStepRow[] {
    return listAggregated(
      CompletionByFromStepRowSchema,
      "e",
      `
        SELECT t.version_id AS versionId, t.variant, t.from_step_id AS fromStepId,
               COUNT(DISTINCT e.session_id) AS sessionCount
        FROM events e
        INNER JOIN session_transitions t ON t.transition_id = e.transition_id
        WHERE e.event_name = 'step_completed' {{clause}}
        GROUP BY t.version_id, t.variant, t.from_step_id
      `,
      filters,
    );
  }

  function listVersionVariantBreakdown(filters: AnalyticsFilters): VersionVariantBreakdownRow[] {
    return listAggregated(
      VersionVariantBreakdownRowSchema,
      "",
      `
        SELECT
          version_id AS versionId,
          variant,
          COUNT(DISTINCT CASE WHEN event_name = 'session_started' THEN session_id END) AS started,
          COUNT(DISTINCT CASE WHEN event_name = 'cta_clicked' THEN session_id END) AS ctaClicked,
          COUNT(DISTINCT CASE WHEN event_name = 'result_viewed' THEN session_id END) AS resultViewed
        FROM events
        WHERE 1=1 {{clause}}
        GROUP BY version_id, variant
      `,
      filters,
    );
  }

  return {
    countDistinctSessionsStarted: (filters: AnalyticsFilters) => countDistinctEvent("session_started", filters),
    countDistinctSessionsWithEvent: countDistinctEvent,
    countDistinctSessionsReachedResult: (filters: AnalyticsFilters) => countDistinctEvent("result_viewed", filters),
    countDistinctSessionsWithCta: (filters: AnalyticsFilters) => countDistinctEvent("cta_clicked", filters),
    listCompletionEdges,
    listStepViews,
    listCompletionsByFromStep,
    listVersionVariantBreakdown,
  };
}
