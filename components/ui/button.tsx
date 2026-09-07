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
  { variant = "primary", cta, className, type = "button", ...props },
  ref,
) {
  const resolvedClassName = buttonClassName(variant, cta, className);
  if (type === "submit") {
    return <button ref={ref} type="submit" className={resolvedClassName} {...props} />;
  }
  if (type === "reset") {
    return <button ref={ref} type="reset" className={resolvedClassName} {...props} />;
  }
  return <button ref={ref} type="button" className={resolvedClassName} {...props} />;
});
