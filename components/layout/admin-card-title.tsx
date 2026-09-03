import { type ReactNode } from "react";

type AdminCardTitleProps = {
  as?: "h1" | "h2";
  children: ReactNode;
};

export function AdminCardTitle({ as: Tag = "h1", children }: AdminCardTitleProps) {
  return <Tag className="admin-card__title">{children}</Tag>;
}
