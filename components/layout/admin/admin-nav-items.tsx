import type { ReactNode } from "react";

type AdminNavItemsProps = {
  children: ReactNode;
};

export function AdminNavItems({ children }: AdminNavItemsProps) {
  return <div className="admin-nav__items">{children}</div>;
}
