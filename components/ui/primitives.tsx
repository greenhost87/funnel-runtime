import type { ReactNode } from "react";

type StatusTagProps = {
  children: ReactNode;
};

export function StatusTag({ children }: StatusTagProps) {
  return <span className="tag is-success is-light">{children}</span>;
}

type OptionProps = {
  value?: string | number | readonly string[];
  label?: string;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Option(props: OptionProps) {
  return <option {...props} />;
}
