"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import type { LayoutDivProps, LayoutParagraphProps } from "@/components/layout/html-props";

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

function analyticsChartPanelHint(hint: string): ReactNode {
  return <p className="analytics-chart-panel__hint">{hint}</p>;
}

function analyticsChartPanelKeyDown(onClick: () => void, event: KeyboardEvent<HTMLElement>): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick();
  }
}

function analyticsChartPanelKeyDownHandler(
  onClick: (() => void) | undefined,
): ((event: KeyboardEvent<HTMLElement>) => void) | undefined {
  if (!onClick) {
    return undefined;
  }
  return (event) => {
    analyticsChartPanelKeyDown(onClick, event);
  };
}

type AnalyticsChartPanelSectionAttrs = {
  className: string;
  onKeyDown: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  role: "button" | undefined;
  tabIndex: number | undefined;
  "aria-pressed": boolean | undefined;
};

function analyticsChartPanelHintContent(hint?: string): ReactNode {
  return hint ? analyticsChartPanelHint(hint) : null;
}

function analyticsChartPanelBodyClassName(options: {
  interactive: boolean;
  selected: boolean;
}): string {
  return [
    "analytics-chart-panel__body",
    options.interactive ? "analytics-chart-panel__body--interactive" : "",
    options.selected ? "analytics-chart-panel__body--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function analyticsChartPanelBodyAttrs(options: {
  onClick?: () => void;
  selected: boolean;
}): AnalyticsChartPanelSectionAttrs {
  const interactive = Boolean(options.onClick);
  return {
    className: analyticsChartPanelBodyClassName({ interactive, selected: options.selected }),
    onKeyDown: analyticsChartPanelKeyDownHandler(options.onClick),
    role: interactive ? "button" : undefined,
    tabIndex: interactive ? 0 : undefined,
    "aria-pressed": interactive ? options.selected : undefined,
  };
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

interface AnalyticsChartPanelBodyProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

export function AnalyticsChartPanelBody({
  children,
  selected = false,
  onClick,
  "aria-label": ariaLabel,
}: AnalyticsChartPanelBodyProps) {
  return (
    <div
      {...analyticsChartPanelBodyAttrs({ onClick, selected })}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

interface AnalyticsChartPanelProps {
  children: ReactNode;
  as?: "section" | "div";
  id?: string;
  "aria-label"?: string;
  title?: ReactNode;
  selected?: boolean;
  hint?: string;
  wide?: boolean;
}

function analyticsChartPanelShellClassName(options: { selected: boolean; wide: boolean }): string {
  return [
    "analytics-chart-panel",
    "box",
    options.selected ? "analytics-chart-panel--selected" : "",
    options.wide ? "analytics-chart-panel--wide" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AnalyticsChartPanel({
  children,
  title,
  selected = false,
  hint,
  wide = false,
  ...props
}: AnalyticsChartPanelProps) {
  return (
    <section className={analyticsChartPanelShellClassName({ selected, wide })} {...props}>
      {title}
      {analyticsChartPanelHintContent(hint)}
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
