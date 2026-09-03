import { type ReactNode } from "react";

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
