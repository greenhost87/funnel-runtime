import Link from "next/link";
import type { ReactNode } from "react";
import type {
  LayoutDivProps,
  LayoutMainProps,
  LayoutNavProps,
} from "@/components/layout/html-props";

export function AdminLayout({ children, ...props }: LayoutDivProps) {
  return (
    <div className="admin-layout" {...props}>
      {children}
    </div>
  );
}

export function AdminMain({ children, ...props }: LayoutMainProps) {
  return (
    <main className="admin-main" {...props}>
      {children}
    </main>
  );
}

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

type AdminNavItemsProps = {
  children: ReactNode;
};

export function AdminNavItems({ children }: AdminNavItemsProps) {
  return <div className="admin-nav__items">{children}</div>;
}

type AdminNavFooterProps = {
  children: ReactNode;
};

export function AdminNavFooter({ children }: AdminNavFooterProps) {
  return <div className="admin-nav__footer">{children}</div>;
}

type AdminNavIconProps = {
  children: ReactNode;
};

export function AdminNavIcon({ children }: AdminNavIconProps) {
  return <span className="admin-nav__icon">{children}</span>;
}

type AdminNavLabelProps = {
  children: ReactNode;
};

export function AdminNavLabel({ children }: AdminNavLabelProps) {
  return <span className="admin-nav__label">{children}</span>;
}

function AdminValidationErrors({ children, ...props }: LayoutDivProps) {
  return (
    <div className="notification is-danger is-light admin-validation-errors" {...props}>
      {children}
    </div>
  );
}

type AdminErrorListProps = {
  errors: readonly string[];
};

export function AdminErrorList({ errors }: AdminErrorListProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <AdminValidationErrors>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </AdminValidationErrors>
  );
}

type VersionsHistoryRowProps = {
  active?: boolean;
  children: ReactNode;
};

function versionsHistoryRowClassName(active?: boolean): string | undefined {
  return active ? "versions-history__row--active" : undefined;
}

export function VersionsHistoryRow({ active, children }: VersionsHistoryRowProps) {
  return <div className={versionsHistoryRowClassName(active)}>{children}</div>;
}
