import type { LayoutHeadingProps } from "@/components/layout/html-props";

export function FunnelTitle({ children, ...props }: LayoutHeadingProps) {
  return (
    <h1 className="title is-3 funnel__title" {...props}>
      {children}
    </h1>
  );
}
