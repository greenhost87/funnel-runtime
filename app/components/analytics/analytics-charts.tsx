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
  AnalyticsChartContainer,
  AnalyticsChartPanel,
  AnalyticsChartPanelBody,
  AnalyticsChartsGrid,
  analyticsChartPanelAriaLabel,
  analyticsChartPanelContent,
  analyticsChartPanelSelected,
} from "@/components/layout/analytics-primitives";
import type {
  AnalyticsComparison,
  AnalyticsLabels,
  SessionsByDayMetric,
  StepFunnelMetric,
} from "@/system/analytics/analytics.service";
import { formatVariantComparisonLabel } from "@/app/components/analytics/analytics-labels";
import {
  buildSessionsOverTimeChartData,
  buildStepFunnelChartView,
  CHART_COLORS,
  chartAxisProps,
  chartTooltipStyle,
  formatPercent,
  formatSessionsTooltipLabel,
  formatStepFunnelTooltipLabel,
  type StepFunnelChartView,
} from "@/app/components/analytics/chart-theme";

type Props = {
  stepFunnel: StepFunnelMetric[];
  sessionsByDay: SessionsByDayMetric[];
  comparisons: AnalyticsComparison[];
  labels: AnalyticsLabels;
  detailPanel: AnalyticsDetailPanel | null;
  onDetailPanelChange: (panel: AnalyticsDetailPanel | null) => void;
};

export const ANALYTICS_DETAIL_PANELS = ["step-funnel", "variant-comparison"] as const;
export type AnalyticsDetailPanel = (typeof ANALYTICS_DETAIL_PANELS)[number];

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
  detailHint?: string;
  selected?: boolean;
  onSelect?: () => void;
  wide?: boolean;
  canvasHeightPx?: number;
};

function ChartPanel({
  title,
  emptyMessage,
  hasData,
  children,
  detailHint,
  selected = false,
  onSelect,
  wide = false,
  canvasHeightPx,
}: ChartPanelProps) {
  return (
    <AnalyticsChartPanel
      selected={analyticsChartPanelSelected(onSelect, selected)}
      hint={detailHint}
      wide={wide}
      title={<AdminCardTitle as="h2">{title}</AdminCardTitle>}
    >
      {onSelect ? (
        <AnalyticsChartPanelBody
          selected={selected}
          onClick={onSelect}
          aria-label={analyticsChartPanelAriaLabel(title, detailHint)}
        >
          {analyticsChartPanelContent({ hasData, emptyMessage, canvasHeightPx, children })}
        </AnalyticsChartPanelBody>
      ) : (
        analyticsChartPanelContent({ hasData, emptyMessage, canvasHeightPx, children })
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

type StepFunnelChartProps = {
  chartView: StepFunnelChartView;
  selected: boolean;
  onSelect: () => void;
};

function StepFunnelBars({ chartView }: { chartView: StepFunnelChartView }) {
  return (
    <BarChart
      data={chartView.chartData}
      layout="vertical"
      margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
      barCategoryGap="24%"
      barGap={4}
    >
      <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" allowDecimals={false} {...chartAxisProps} />
      <YAxis
        type="category"
        dataKey="label"
        width={chartView.axisWidthPx}
        interval={0}
        tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
        axisLine={{ stroke: CHART_COLORS.grid }}
        tickLine={false}
      />
      <Tooltip
        contentStyle={chartTooltipStyle}
        wrapperStyle={{ zIndex: 2 }}
        labelFormatter={(_, payload) => formatStepFunnelTooltipLabel(payload)}
      />
      <Legend />
      <Bar dataKey="views" name="Views" fill={CHART_COLORS.info} radius={[0, 4, 4, 0]} />
      <Bar
        dataKey="completions"
        name="Completions"
        fill={CHART_COLORS.success}
        radius={[0, 4, 4, 0]}
      />
    </BarChart>
  );
}

function StepFunnelChart({ chartView, selected, onSelect }: StepFunnelChartProps) {
  return (
    <ChartPanel
      title="Step funnel"
      emptyMessage="No step views recorded yet."
      hasData={chartView.chartData.length > 0}
      detailHint="Click chart to show step transitions table"
      selected={selected}
      onSelect={onSelect}
      wide
      canvasHeightPx={chartView.heightPx}
    >
      <AnalyticsChartContainer>
        <StepFunnelBars chartView={chartView} />
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

type VariantComparisonChartProps = {
  data: VariantChartRow[];
  selected: boolean;
  onSelect: () => void;
};

function VariantComparisonBars({ data }: { data: VariantChartRow[] }) {
  return (
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
  );
}

function VariantComparisonChart({ data, selected, onSelect }: VariantComparisonChartProps) {
  return (
    <ChartPanel
      title="A/B and version conversion"
      emptyMessage="No variant comparison data yet."
      hasData={data.length > 0}
      detailHint="Click to show comparison table"
      selected={selected}
      onSelect={onSelect}
      wide
    >
      <AnalyticsChartContainer>
        <VariantComparisonBars data={data} />
      </AnalyticsChartContainer>
    </ChartPanel>
  );
}

function buildVariantChartRows(
  comparisons: AnalyticsComparison[],
  labels: AnalyticsLabels,
): VariantChartRow[] {
  return comparisons.map((row) => ({
    label: formatVariantComparisonLabel(row, labels),
    ctaFromStart: (row.primaryCtaFromStartConversion ?? 0) * 100,
    resultReach: (row.resultReachRate ?? 0) * 100,
    ctaCtr: (row.ctaCtr ?? 0) * 100,
  }));
}

function toggleDetailPanel(
  current: AnalyticsDetailPanel | null,
  panel: AnalyticsDetailPanel,
): AnalyticsDetailPanel | null {
  return current === panel ? null : panel;
}

export function AnalyticsCharts({
  stepFunnel,
  sessionsByDay,
  comparisons,
  labels,
  detailPanel,
  onDetailPanelChange,
}: Props) {
  const variantRows = buildVariantChartRows(comparisons, labels);
  const stepFunnelView = buildStepFunnelChartView(stepFunnel, labels);

  return (
    <AnalyticsChartsGrid>
      <SessionsOverTimeChart data={sessionsByDay} />
      <StepFunnelChart
        chartView={stepFunnelView}
        selected={detailPanel === ANALYTICS_DETAIL_PANELS[0]}
        onSelect={() => {
          onDetailPanelChange(toggleDetailPanel(detailPanel, ANALYTICS_DETAIL_PANELS[0]));
        }}
      />
      <VariantComparisonChart
        data={variantRows}
        selected={detailPanel === ANALYTICS_DETAIL_PANELS[1]}
        onSelect={() => {
          onDetailPanelChange(toggleDetailPanel(detailPanel, ANALYTICS_DETAIL_PANELS[1]));
        }}
      />
    </AnalyticsChartsGrid>
  );
}
