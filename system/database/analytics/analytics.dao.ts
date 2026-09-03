import type { Database } from "bun:sqlite";
import type { FunnelVariant } from "@/system/funnel/config.types";

export type AnalyticsFilters = {
  utmCampaign?: string;
};

export class AnalyticsDao {
  constructor(private readonly db: Database) {}

  countDistinctSessionsStarted(filters: AnalyticsFilters): number {
    return this.countDistinctEvent("session_started", filters);
  }

  countDistinctSessionsWithEvent(eventName: string, filters: AnalyticsFilters): number {
    return this.countDistinctEvent(eventName, filters);
  }

  countDistinctSessionsReachedResult(filters: AnalyticsFilters): number {
    return this.countDistinctEvent("result_viewed", filters);
  }

  countDistinctSessionsWithCta(filters: AnalyticsFilters): number {
    return this.countDistinctEvent("cta_clicked", filters);
  }

  listCompletionEdges(filters: AnalyticsFilters): Array<{
    versionId: string;
    variant: FunnelVariant;
    fromStepId: string;
    toStepId: string | null;
    toResult: boolean;
    sessionCount: number;
  }> {
    const { clause, params } = this.campaignClause("e", filters);
    const rows = this.db
      .query(
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
        WHERE e.event_name = 'step_completed' ${clause}
        GROUP BY t.version_id, t.variant, t.from_step_id, t.to_step_id, t.to_result
      `,
      )
      .all(...params) as Array<{
      versionId: string;
      variant: FunnelVariant;
      fromStepId: string;
      toStepId: string | null;
      toResult: number;
      sessionCount: number;
    }>;

    return rows.map((row) => ({
      versionId: row.versionId,
      variant: row.variant,
      fromStepId: row.fromStepId,
      toStepId: row.toStepId,
      toResult: row.toResult === 1,
      sessionCount: row.sessionCount,
    }));
  }

  listStepViews(filters: AnalyticsFilters): Array<{
    versionId: string;
    variant: FunnelVariant;
    stepId: string;
    sessionCount: number;
  }> {
    const { clause, params } = this.campaignClause("e", filters);
    const rows = this.db
      .query(
        `
        SELECT version_id AS versionId, variant, step_id AS stepId,
               COUNT(DISTINCT session_id) AS sessionCount
        FROM events e
        WHERE event_name = 'step_viewed' AND step_id IS NOT NULL ${clause}
        GROUP BY version_id, variant, step_id
      `,
      )
      .all(...params) as Array<{
      versionId: string;
      variant: FunnelVariant;
      stepId: string;
      sessionCount: number;
    }>;
    return rows;
  }

  listCompletionsByFromStep(filters: AnalyticsFilters): Array<{
    versionId: string;
    variant: FunnelVariant;
    fromStepId: string;
    sessionCount: number;
  }> {
    const { clause, params } = this.campaignClause("e", filters);
    const rows = this.db
      .query(
        `
        SELECT t.version_id AS versionId, t.variant, t.from_step_id AS fromStepId,
               COUNT(DISTINCT e.session_id) AS sessionCount
        FROM events e
        INNER JOIN session_transitions t ON t.transition_id = e.transition_id
        WHERE e.event_name = 'step_completed' ${clause}
        GROUP BY t.version_id, t.variant, t.from_step_id
      `,
      )
      .all(...params) as Array<{
      versionId: string;
      variant: FunnelVariant;
      fromStepId: string;
      sessionCount: number;
    }>;
    return rows;
  }

  listVersionVariantBreakdown(filters: AnalyticsFilters): Array<{
    versionId: string;
    variant: FunnelVariant;
    started: number;
    ctaClicked: number;
    resultViewed: number;
  }> {
    const { clause, params } = this.campaignClause("", filters);
    const whereCampaign = filters.utmCampaign ? `AND utm_campaign = ?` : "";
    const campaignParam = filters.utmCampaign ? [filters.utmCampaign] : [];

    const rows = this.db
      .query(
        `
        SELECT
          version_id AS versionId,
          variant,
          COUNT(DISTINCT CASE WHEN event_name = 'session_started' THEN session_id END) AS started,
          COUNT(DISTINCT CASE WHEN event_name = 'cta_clicked' THEN session_id END) AS ctaClicked,
          COUNT(DISTINCT CASE WHEN event_name = 'result_viewed' THEN session_id END) AS resultViewed
        FROM events
        WHERE 1=1 ${whereCampaign}
        GROUP BY version_id, variant
      `,
      )
      .all(...campaignParam) as Array<{
      versionId: string;
      variant: FunnelVariant;
      started: number;
      ctaClicked: number;
      resultViewed: number;
    }>;

    void clause;
    void params;
    return rows;
  }

  private countDistinctEvent(eventName: string, filters: AnalyticsFilters): number {
    const { clause, params } = this.campaignClause("", filters);
    const row = this.db
      .query(
        `SELECT COUNT(DISTINCT session_id) AS count FROM events WHERE event_name = ? ${clause}`,
      )
      .get(eventName, ...params) as { count: number };
    return row.count;
  }

  private campaignClause(
    alias: string,
    filters: AnalyticsFilters,
  ): { clause: string; params: string[] } {
    if (!filters.utmCampaign) {
      return { clause: "", params: [] };
    }
    const prefix = alias ? `${alias}.` : "";
    return { clause: `AND ${prefix}utm_campaign = ?`, params: [filters.utmCampaign] };
  }
}
