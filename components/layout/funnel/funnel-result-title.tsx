import type { LayoutHeadingProps } from "@/components/layout/html-props";

export function FunnelResultTitle({ children, ...props }: LayoutHeadingProps) {
  return (
    <h2 className="title is-4 funnel__result-title" {...props}>
      {children}
    </h2>
  );
}
