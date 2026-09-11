import { type ReactNode } from "react";

type PageContentProps = {
  children: ReactNode;
};

export function PageContent({ children }: PageContentProps) {
  return <div className="page-content">{children}</div>;
}

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return <main className="page-shell">{children}</main>;
}

type AdminLoginProps = {
  children: ReactNode;
};

export function AdminLogin({ children }: AdminLoginProps) {
  return (
    <section className="section admin-login">
      <div className="box">{children}</div>
    </section>
  );
}
