import type { LayoutDivProps } from "@/components/layout/html-props";

export function FunnelOptions({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel__options" {...props}>
      {children}
    </div>
  );
}
