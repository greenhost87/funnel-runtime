import { ThemeToggle } from "@/components/ui/theme-toggle";

type AdminNavThemeToggleProps = {
  collapsed: boolean;
};

export function AdminNavThemeToggle({ collapsed }: AdminNavThemeToggleProps) {
  return <ThemeToggle collapsed={collapsed} className="admin-nav__theme" />;
}
