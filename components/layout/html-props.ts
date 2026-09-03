import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

interface LayoutAccessibilityProps {
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export interface LayoutDivProps extends LayoutAccessibilityProps {
  children: ReactNode;
  "aria-hidden"?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export interface LayoutHeadingProps extends LayoutAccessibilityProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLHeadingElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLHeadingElement>) => void;
}

export interface LayoutParagraphProps extends LayoutAccessibilityProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLParagraphElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLParagraphElement>) => void;
}

export interface LayoutNavProps extends LayoutAccessibilityProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface LayoutMainProps {
  children: ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
}

export interface LayoutTableProps {
  children: ReactNode;
  id?: string;
  role?: string;
  "aria-label"?: string;
}

export interface FunnelProgressFillProps {
  percent: number;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
}

export interface AdminCardProps {
  children: ReactNode;
  as?: "section" | "div";
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
  "aria-label"?: string;
}

export interface FunnelConfigErrorProps {
  children: ReactNode;
  as?: "p" | "div";
  id?: string;
  role?: string;
  tabIndex?: number;
}

export interface FunnelDescriptionProps {
  children: ReactNode;
  as?: "p" | "div" | "span";
  id?: string;
  role?: string;
}

export interface LayoutCardSurfaceProps {
  children: ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export interface AdminHistoryItemProps extends LayoutCardSurfaceProps {
  active?: boolean;
}

export interface AnalyticsCardProps {
  children: ReactNode;
  primary?: boolean;
  id?: string;
  role?: string;
}
