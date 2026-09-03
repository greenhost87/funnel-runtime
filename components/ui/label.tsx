import { type MouseEvent, type ReactNode } from "react";

type LabelVariant = "form" | "option";

type LabelProps = {
  variant?: LabelVariant;
  selected?: boolean;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
  id?: string;
  onClick?: (event: MouseEvent<HTMLLabelElement>) => void;
};

function labelClassName(
  variant: LabelVariant,
  selected: boolean | undefined,
  className: string | undefined,
): string {
  return [
    variant === "form" ? "label" : "funnel__option",
    variant === "option" && selected ? "funnel__option--selected" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Label({ variant = "form", selected, className, children, ...props }: LabelProps) {
  return (
    <label className={labelClassName(variant, selected, className)} {...props}>
      {children}
    </label>
  );
}
