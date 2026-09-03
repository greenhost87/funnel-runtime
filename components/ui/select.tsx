import { forwardRef, type ChangeEvent, type FocusEvent, type MouseEvent, type ReactNode } from "react";

type SelectProps = {
  className?: string;
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onFocus?: (event: FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void;
  onClick?: (event: MouseEvent<HTMLSelectElement>) => void;
  "aria-label"?: string;
  children?: ReactNode;
};

function selectClassName(className: string | undefined): string {
  return ["form-select", className].filter(Boolean).join(" ");
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={selectClassName(className)} {...props} />;
});
