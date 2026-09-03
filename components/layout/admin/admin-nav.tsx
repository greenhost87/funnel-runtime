import type { LayoutNavProps } from "@/components/layout/html-props";

export function AdminNav({ children, ...props }: LayoutNavProps) {
  return (
    <nav className="admin-nav" {...props}>
      {children}
    </nav>
  );
}
