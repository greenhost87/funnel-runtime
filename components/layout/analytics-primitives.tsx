"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import type { LayoutDivProps } from "@/components/ui/html-props";
import { AnalyticsEmpty } from "@/components/ui/analytics-shell";

export function AnalyticsCardLabel({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-card__label" {...props}>
      {children}
    </div>
  );
}

export function AnalyticsCardValue({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-card__value" {...props}>
      {children}
    </div>
  );
}

interface AnalyticsChartCanvasProps {
  children: ReactNode;
  heightPx?: number;
}

function AnalyticsChartCanvas({ children, heightPx }: AnalyticsChartCanvasProps) {
  return (
    <div
      className="analytics-chart-panel__canvas"
      style={heightPx ? { height: `${heightPx}px` } : undefined}
    >
      {children}
    </div>
  );
}

export function AnalyticsChartContainer({ children }: { children: ReactNode }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  );
}

interface AnalyticsChartPanelContentOptions {
  hasData: boolean;
  emptyMessage: string;
  canvasHeightPx?: number;
  children: ReactNode;
}

export function analyticsChartPanelContent(options: AnalyticsChartPanelContentOptions): ReactNode {
  if (!options.hasData) {
    return <AnalyticsEmpty>{options.emptyMessage}</AnalyticsEmpty>;
  }
  return (
    <AnalyticsChartCanvas heightPx={options.canvasHeightPx}>
      {options.children}
    </AnalyticsChartCanvas>
  );
}

export function analyticsChartPanelAriaLabel(title: string, detailHint?: string): string {
  if (detailHint) {
    return `${title} chart. ${detailHint}`;
  }
  return `${title} chart`;
}

export function analyticsChartPanelSelected(
  onSelect: (() => void) | undefined,
  selected: boolean,
): boolean {
  return Boolean(onSelect) && selected;
}

export function AnalyticsFilters({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-filters" {...props}>
      {children}
    </div>
  );
}
