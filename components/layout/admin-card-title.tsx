import { type ReactNode } from "react";

type AdminCardTitleProps = {
  as?: "h1" | "h2";
  children: ReactNode;
};

export function AdminCardTitle({ as: Tag = "h1", children }: AdminCardTitleProps) {
  const className = Tag === "h1" ? "title is-4" : "title is-5 admin-card__title";
  return <Tag className={className}>{children}</Tag>;
}
