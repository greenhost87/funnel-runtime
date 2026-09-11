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

export interface LayoutParagraphProps extends LayoutAccessibilityProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLParagraphElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLParagraphElement>) => void;
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

export interface AnalyticsCardProps {
  children: ReactNode;
  primary?: boolean;
  id?: string;
  role?: string;
}
