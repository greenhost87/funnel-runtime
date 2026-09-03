import type { ReactNode } from "react";

type AdminNavIconProps = {
  children: ReactNode;
};

export function AdminNavIcon({ children }: AdminNavIconProps) {
  return <span className="admin-nav__icon">{children}</span>;
}
