import type { ReactNode } from "react";

type AdminNavFooterProps = {
  children: ReactNode;
};

export function AdminNavFooter({ children }: AdminNavFooterProps) {
  return <div className="admin-nav__footer">{children}</div>;
}
