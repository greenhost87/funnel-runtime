import type { LayoutDivProps } from "@/components/layout/html-props";

export function AdminLayout({ children, ...props }: LayoutDivProps) {
  return (
    <div className="admin-layout" {...props}>
      {children}
    </div>
  );
}
