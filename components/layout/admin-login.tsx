import { type ReactNode } from "react";

type AdminLoginProps = {
  children: ReactNode;
};

export function AdminLogin({ children }: AdminLoginProps) {
  return <div className="admin-login">{children}</div>;
}
