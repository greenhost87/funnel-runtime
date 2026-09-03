import type { LayoutParagraphProps } from "@/components/layout/html-props";

export function FunnelResultBody({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__result-body" {...props}>
      {children}
    </p>
  );
}
