import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
