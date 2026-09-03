import type { LayoutDivProps } from "@/components/layout/html-props";

export function FunnelResult({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__result" {...props}>
      {children}
    </div>
  );
}
