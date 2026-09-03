import { type ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
};

export function FormField({ children }: FormFieldProps) {
  return <div className="field">{children}</div>;
}
