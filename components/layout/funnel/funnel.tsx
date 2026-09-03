import type { LayoutDivProps } from "@/components/layout/html-props";

export function Funnel({ children, ...props }: LayoutDivProps) {
  return (
    <div className="funnel" {...props}>
      {children}
    </div>
  );
}
