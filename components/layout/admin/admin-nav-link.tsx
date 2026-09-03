import Link from "next/link";
import type { ReactNode } from "react";

type AdminNavLinkProps = {
  href: string;
  children: ReactNode;
  active?: boolean;
  title?: string;
};

export function AdminNavLink({ href, children, active, title }: AdminNavLinkProps) {
  return (
    <Link
      href={href}
      className="admin-nav__link"
      aria-current={active ? "page" : undefined}
      title={title}
    >
      {children}
    </Link>
  );
}
