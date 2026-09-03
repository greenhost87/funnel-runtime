import type { LayoutDivProps } from "@/components/layout/html-props";

export function AdminHistory({ children, ...props }: LayoutDivProps) {
  return (
    <div className="admin-history" {...props}>
      {children}
    </div>
  );
}
