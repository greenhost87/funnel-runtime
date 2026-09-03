import { forwardRef, type MouseEvent, type ReactNode } from "react";

type ButtonProps = {
  variant?: "primary" | "secondary" | "nav";
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
  title?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
  "aria-disabled"?: boolean;
  "aria-expanded"?: boolean;
};

function buttonClassName(
  variant: "primary" | "secondary" | "nav",
  cta: boolean | undefined,
  className: string | undefined,
): string {
  if (variant === "nav") {
    return className ?? "";
  }

  return [
    "button",
    variant === "primary" ? "is-primary" : "",
    cta ? "is-fullwidth is-medium" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", cta, className, ...props },
  ref,
) {
  return <button ref={ref} className={buttonClassName(variant, cta, className)} {...props} />;
});
