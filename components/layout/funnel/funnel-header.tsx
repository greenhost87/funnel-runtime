import type { LayoutDivProps } from "@/components/layout/html-props";

export function FunnelHeader({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__header" {...props}>
      {children}
    </div>
  );
}
