"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import type {
  AdminCardProps,
  LayoutDivProps,
  LayoutParagraphProps,
} from "@/components/layout/html-props";

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

export function AnalyticsChartCanvas({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-chart-panel__canvas" {...props}>
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

export function AnalyticsChartPanel({ children, ...props }: AdminCardProps) {
  return (
    <section className="analytics-chart-panel box" {...props}>
      {children}
    </section>
  );
}

export function AnalyticsChartsGrid({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-charts" {...props}>
      {children}
    </div>
  );
}

export function AnalyticsEmpty({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="analytics-empty" {...props}>
      {children}
    </p>
  );
}

export function AnalyticsFilters({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-filters" {...props}>
      {children}
    </div>
  );
}

export function AnalyticsGrid({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-grid" {...props}>
      {children}
    </div>
  );
}

export function AnalyticsTableWrap({ children, ...props }: LayoutDivProps) {
  return (
    <div className="analytics-table-wrap" {...props}>
      {children}
    </div>
  );
}
