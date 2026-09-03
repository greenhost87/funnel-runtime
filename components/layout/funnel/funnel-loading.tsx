import type { LayoutParagraphProps } from "@/components/layout/html-props";

export function FunnelLoading({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="funnel__loading" {...props}>
      {children}
    </p>
  );
}
