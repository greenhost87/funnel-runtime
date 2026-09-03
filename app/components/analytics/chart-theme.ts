import type { CSSProperties } from "react";
import type {
  AnalyticsLabels,
  SessionsByDayMetric,
  StepFunnelMetric,
} from "@/system/analytics/analytics.service";
import {
  buildStepFunnelLabelContext,
  formatStepFunnelAxisLabel,
  formatStepFunnelFullLabel,
} from "@/app/components/analytics/analytics-labels";

export const CHART_COLORS = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  info: "hsl(198, 89%, 48%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "var(--color-error)",
  muted: "var(--color-text-muted)",
  grid: "var(--color-border)",
  surface: "var(--color-surface)",
} as const;

export const chartAxisProps = {
  tick: { fill: CHART_COLORS.muted, fontSize: 12 },
  axisLine: { stroke: CHART_COLORS.grid },
  tickLine: { stroke: CHART_COLORS.grid },
};

export const chartTooltipStyle: CSSProperties = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text)",
  fontSize: "var(--font-size-sm)",
};

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatChartDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildSessionsOverTimeChartData(data: SessionsByDayMetric[]) {
  return data.map((row) => ({
    ...row,
    label: formatChartDate(row.date),
  }));
}

export interface StepFunnelChartRow {
  versionId: string;
  variant: string;
  stepId: string;
  views: number;
  completions: number;
  label: string;
  fullLabel: string;
}

export interface StepFunnelChartView {
  chartData: StepFunnelChartRow[];
  axisWidthPx: number;
  heightPx: number;
}

function buildStepFunnelChartData(
  data: StepFunnelMetric[],
  labels: AnalyticsLabels,
): StepFunnelChartRow[] {
  const context = buildStepFunnelLabelContext(data, labels);
  return data.map((row) => ({
    versionId: row.versionId,
    variant: row.variant,
    stepId: row.stepId,
    views: row.views,
    completions: row.completions,
    label: formatStepFunnelAxisLabel(row, labels, context),
    fullLabel: formatStepFunnelFullLabel(row, labels),
  }));
}

const STEP_FUNNEL_MIN_HEIGHT_PX = 288;
const STEP_FUNNEL_ROW_HEIGHT_PX = 44;
const STEP_FUNNEL_CHROME_PX = 72;

function stepFunnelChartHeightPx(rowCount: number): number {
  if (rowCount <= 0) {
    return STEP_FUNNEL_MIN_HEIGHT_PX;
  }
  return Math.max(
    STEP_FUNNEL_MIN_HEIGHT_PX,
    rowCount * STEP_FUNNEL_ROW_HEIGHT_PX + STEP_FUNNEL_CHROME_PX,
  );
}

function stepFunnelAxisWidthPx(axisLabels: string[]): number {
  const longest = axisLabels.reduce((max, label) => Math.max(max, label.length), 0);
  return Math.min(320, Math.max(160, longest * 7));
}

export function buildStepFunnelChartView(
  data: StepFunnelMetric[],
  labels: AnalyticsLabels,
): StepFunnelChartView {
  const chartData = buildStepFunnelChartData(data, labels);
  return {
    chartData,
    axisWidthPx: stepFunnelAxisWidthPx(chartData.map((row) => row.label)),
    heightPx: stepFunnelChartHeightPx(chartData.length),
  };
}

type StepFunnelTooltipPayload = {
  payload?: {
    fullLabel?: string;
  };
};

export function formatStepFunnelTooltipLabel(payload: readonly StepFunnelTooltipPayload[]): string {
  return payload[0]?.payload?.fullLabel ?? "";
}

type SessionsTooltipPayload = {
  payload?: {
    date?: string;
  };
};

export function formatSessionsTooltipLabel(payload: readonly SessionsTooltipPayload[]): string {
  const date = payload[0]?.payload?.date;
  return date ? formatChartDate(date) : "";
}
