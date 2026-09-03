"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCardTitle } from "@/components/layout/primitives";
import {
  AnalyticsChartCanvas,
  AnalyticsChartContainer,
  AnalyticsChartPanel,
  AnalyticsChartsGrid,
  AnalyticsEmpty,
} from "@/components/layout/analytics-primitives";
import type {
  AnalyticsComparison,
  SessionsByDayMetric,
  StepFunnelMetric,
} from "@/system/analytics/analytics.service";
import {
  buildSessionsOverTimeChartData,
  buildStepFunnelChartData,
  CHART_COLORS,
  chartAxisProps,
  chartTooltipStyle,
  formatPercent,
  formatSessionsTooltipLabel,
} from "@/app/components/analytics/chart-theme";

type Props = {
  stepFunnel: StepFunnelMetric[];
  sessionsByDay: SessionsByDayMetric[];
  comparisons: AnalyticsComparison[];
};

type VariantChartRow = {
  label: string;
  ctaFromStart: number;
  resultReach: number;
  ctaCtr: number;
};

type ChartPanelProps = {
  title: string;
  emptyMessage: string;
  hasData: boolean;
  children: ReactNode;
};

function ChartPanel({ title, emptyMessage, hasData, children }: ChartPanelProps) {
  return (
    <AnalyticsChartPanel>
      <AdminCardTitle as="h2">{title}</AdminCardTitle>
      {hasData ? (
        <AnalyticsChartCanvas>{children}</AnalyticsChartCanvas>
      ) : (
        <AnalyticsEmpty>{emptyMessage}</AnalyticsEmpty>
      )}
    </AnalyticsChartPanel>
  );
}

function SessionsOverTimeChart({ data }: { data: SessionsByDayMetric[] }) {
  const chartData = buildSessionsOverTimeChartData(data);

  return (
    <ChartPanel
      title="Sessions over time"
      emptyMessage="No session starts recorded yet."
      hasData={chartData.length > 0}
    >
      <AnalyticsChartContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...chartAxisProps} />
          <YAxis allowDecimals={false} {...chartAxisProps} width={36} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [value ?? 0, "Sessions"]}
            labelFormatter={(_, payload) => formatSessionsTooltipLabel(payload)}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke={CHART_COLORS.primary}
            fill="url(#sessionsGradient)"
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_COLORS.primary }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </AnalyticsChartContainer>
    </ChartPanel>
  );
}

function StepFunnelChart({ data }: { data: StepFunnelMetric[] }) {
  const chartData = buildStepFunnelChartData(data);

  return (
    <ChartPanel
      title="Step funnel"
      emptyMessage="No step views recorded yet."
      hasData={chartData.length > 0}
    >
      <AnalyticsChartContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...chartAxisProps} />
          <YAxis type="category" dataKey="label" width={140} {...chartAxisProps} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend />
          <Bar dataKey="views" name="Views" fill={CHART_COLORS.info} radius={[0, 4, 4, 0]} />
          <Bar
            dataKey="completions"
            name="Completions"
            fill={CHART_COLORS.success}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </AnalyticsChartContainer>
    </ChartPanel>
  );
}

function VariantBars() {
  return (
    <>
      <Bar
        dataKey="ctaFromStart"
        name="CTA from start"
        fill={CHART_COLORS.primary}
        radius={[4, 4, 0, 0]}
      />
      <Bar
        dataKey="resultReach"
        name="Result reach"
        fill={CHART_COLORS.info}
        radius={[4, 4, 0, 0]}
      />
      <Bar dataKey="ctaCtr" name="CTA CTR" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
    </>
  );
}

function VariantComparisonChart({ data }: { data: VariantChartRow[] }) {
  return (
    <ChartPanel
      title="A/B and version conversion"
      emptyMessage="No variant comparison data yet."
      hasData={data.length > 0}
    >
      <AnalyticsChartContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            {...chartAxisProps}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={56}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => formatPercent(Number(value))}
            {...chartAxisProps}
            width={44}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => formatPercent(Number(value ?? 0))}
          />
          <Legend />
          <VariantBars />
        </BarChart>
      </AnalyticsChartContainer>
    </ChartPanel>
  );
}

function buildVariantChartRows(comparisons: AnalyticsComparison[]): VariantChartRow[] {
  return comparisons.map((row) => ({
    label: `${row.variant} · ${row.versionId.slice(0, 8)}`,
    ctaFromStart: (row.primaryCtaFromStartConversion ?? 0) * 100,
    resultReach: (row.resultReachRate ?? 0) * 100,
    ctaCtr: (row.ctaCtr ?? 0) * 100,
  }));
}

export function AnalyticsCharts({ stepFunnel, sessionsByDay, comparisons }: Props) {
  const variantRows = buildVariantChartRows(comparisons);

  return (
    <AnalyticsChartsGrid>
      <SessionsOverTimeChart data={sessionsByDay} />
      <StepFunnelChart data={stepFunnel} />
      <VariantComparisonChart data={variantRows} />
    </AnalyticsChartsGrid>
  );
}
