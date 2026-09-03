import { type ReactNode } from "react";

type PageContentProps = {
  children: ReactNode;
};

export function PageContent({ children }: PageContentProps) {
  return <div className="page-content">{children}</div>;
}
