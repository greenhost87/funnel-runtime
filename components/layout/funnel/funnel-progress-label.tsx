import type { LayoutParagraphProps } from "@/components/layout/html-props";

export function FunnelProgressLabel({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__progress-label" {...props}>
      {children}
    </p>
  );
}
