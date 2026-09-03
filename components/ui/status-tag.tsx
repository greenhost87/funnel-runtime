import type { ReactNode } from "react";

type StatusTagProps = {
  children: ReactNode;
};

export function StatusTag({ children }: StatusTagProps) {
  return <span className="tag is-success is-light">{children}</span>;
}
