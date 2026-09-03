import { CollapseIcon } from "@/components/ui/admin-nav-icons";
import { Button } from "@/components/ui/button";

type AdminNavToggleButtonProps = {
  collapsed: boolean;
  onClick: () => void;
};

export function AdminNavToggleButton({ collapsed, onClick }: AdminNavToggleButtonProps) {
  return (
    <Button
      variant="nav"
      type="button"
      className="admin-nav__link admin-nav__toggle"
      onClick={onClick}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
    >
      <CollapseIcon collapsed={collapsed} className="admin-nav__toggle-icon" />
    </Button>
  );
}
