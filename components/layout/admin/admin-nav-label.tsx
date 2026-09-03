import type { ReactNode } from "react";

type AdminNavLabelProps = {
  children: ReactNode;
};

export function AdminNavLabel({ children }: AdminNavLabelProps) {
  return <span className="admin-nav__label">{children}</span>;
}
