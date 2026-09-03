import type { LayoutNavProps } from "@/components/layout/html-props";

interface AdminNavProps extends LayoutNavProps {
  collapsed?: boolean;
}

function adminNavClassName(collapsed?: boolean): string {
  return ["admin-nav", collapsed ? "admin-nav--collapsed" : ""].filter(Boolean).join(" ");
}

export function AdminNav({ children, collapsed, ...props }: AdminNavProps) {
  return (
    <nav className={adminNavClassName(collapsed)} {...props}>
      {children}
    </nav>
  );
}
