import { forwardRef, type MouseEvent, type ReactNode } from "react";

type ButtonProps = {
  variant?: "primary" | "secondary";
  cta?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children?: ReactNode;
  id?: string;
  name?: string;
  value?: string;
  form?: string;
  autoFocus?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
  "aria-disabled"?: boolean;
};

function buttonClassName(
  variant: "primary" | "secondary",
  cta: boolean | undefined,
  className: string | undefined,
): string {
  return ["btn", `btn--${variant}`, cta ? "btn--cta" : "", className].filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", cta, className, ...props },
  ref,
) {
  return <button ref={ref} className={buttonClassName(variant, cta, className)} {...props} />;
});
