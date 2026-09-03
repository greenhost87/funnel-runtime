import type { LayoutHeadingProps } from "@/components/layout/html-props";

export function FunnelResultTitle({ children, ...props }: LayoutHeadingProps) {
  return (
    <h2 className="funnel__result-title" {...props}>
      {children}
    </h2>
  );
}
