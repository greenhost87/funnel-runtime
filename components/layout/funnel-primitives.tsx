"use client";

import type { LayoutDivProps, LayoutParagraphProps } from "@/components/ui/html-props";

export function Funnel({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel" {...props}>
      {children}
    </div>
  );
}

export function FunnelHeader({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__header" {...props}>
      {children}
    </div>
  );
}

export function FunnelLoading({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__loading" {...props}>
      {children}
    </p>
  );
}

export function FunnelOptions({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__options" {...props}>
      {children}
    </div>
  );
}
