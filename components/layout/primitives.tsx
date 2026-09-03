import { type ReactNode } from "react";
import type { LayoutParagraphProps } from "@/components/layout/html-props";

export function FormError({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="help is-danger" {...props}>
      {children}
    </p>
  );
}

type FormFieldProps = {
  children: ReactNode;
};

export function FormField({ children }: FormFieldProps) {
  return <div className="field">{children}</div>;
}

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

type AdminCardTitleProps = {
  as?: "h1" | "h2";
  children: ReactNode;
};

export function AdminCardTitle({ as: Tag = "h1", children }: AdminCardTitleProps) {
  const className = Tag === "h1" ? "title is-4" : "title is-5 admin-card__title";
  return <Tag className={className}>{children}</Tag>;
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
