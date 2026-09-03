import type { CSSProperties } from "react";
import type { SessionsByDayMetric, StepFunnelMetric } from "@/system/analytics/analytics.service";

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

export function buildStepFunnelChartData(data: StepFunnelMetric[]) {
  return data.map((row) => ({
    ...row,
    label: `${row.variant}·${row.versionId.slice(0, 8)}:${row.stepId}`,
  }));
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
