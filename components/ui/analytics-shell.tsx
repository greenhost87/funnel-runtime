import type { LayoutParagraphProps } from "@/components/ui/html-props";

export function AnalyticsEmpty({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="analytics-empty" {...props}>
      {children}
    </p>
  );
}
