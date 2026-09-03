import type { LayoutDivProps } from "@/components/layout/html-props";

export function FunnelControls({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__controls" {...props}>
      {children}
    </div>
  );
}
