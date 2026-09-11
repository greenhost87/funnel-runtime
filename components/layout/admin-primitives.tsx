import type { ReactNode } from "react";
import type { LayoutDivProps } from "@/components/ui/html-props";
import { AdminCard } from "@/components/layout/class-tagged";
import { AnalyticsEmpty } from "@/components/ui/analytics-shell";

export function AdminShell({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="admin-layout">
      {nav}
      <main className="admin-main">{children}</main>
    </div>
  );
}

function AdminValidationErrors({ children, ...props }: LayoutDivProps) {
  return (
    <div className="notification is-danger is-light admin-validation-errors" {...props}>
      {children}
    </div>
  );
}

function AdminErrorList({ children }: { children: ReactNode }) {
  return (
    <AdminValidationErrors>
      <ul>{children}</ul>
    </AdminValidationErrors>
  );
}

function adminErrorItems(errors: readonly string[]): ReactNode {
  return errors.map((error) => <li key={error}>{error}</li>);
}

export function AdminCardEmpty({ message }: { message: string }) {
  return (
    <AdminCard>
      <AnalyticsEmpty>{message}</AnalyticsEmpty>
    </AdminCard>
  );
}

export function AdminCardWithErrors({
  children,
  errors,
}: {
  children: ReactNode;
  errors: readonly string[];
}) {
  return (
    <AdminCard>
      {children}
      {errors.length > 0 ? <AdminErrorList>{adminErrorItems(errors)}</AdminErrorList> : null}
    </AdminCard>
  );
}
