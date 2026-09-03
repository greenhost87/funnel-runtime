import type { ReactNode } from "react";
import { CollapseIcon } from "@/components/ui/admin-nav-icons";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type PrimarySubmitButtonProps = {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
};

export function PrimarySubmitButton({
  children,
  loading = false,
  loadingLabel,
}: PrimarySubmitButtonProps) {
  return (
    <Button variant="primary" type="submit" disabled={loading}>
      {loading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}

type SecondaryActionButtonProps = {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  loadingLabel?: string;
};

export function SecondaryActionButton({
  children,
  onClick,
  loading = false,
  loadingLabel,
}: SecondaryActionButtonProps) {
  return (
    <Button variant="secondary" type="button" disabled={loading} onClick={onClick}>
      {loading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}

type AdminNavLogoutButtonProps = {
  children: ReactNode;
  onClick: () => void;
  title?: string;
};

export function AdminNavLogoutButton({ children, onClick, title }: AdminNavLogoutButtonProps) {
  return (
    <Button
      variant="nav"
      type="button"
      className="admin-nav__link admin-nav__link--logout"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );
}

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

type AdminNavThemeToggleProps = {
  collapsed: boolean;
};

export function AdminNavThemeToggle({ collapsed }: AdminNavThemeToggleProps) {
  return <ThemeToggle collapsed={collapsed} className="admin-nav__theme" />;
}
