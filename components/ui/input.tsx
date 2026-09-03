import {
  forwardRef,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

type InputVariant = "default" | "form" | "file";

type InputProps = {
  variant?: InputVariant;
  className?: string;
  type?: string;
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  checked?: boolean;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onClick?: (event: MouseEvent<HTMLInputElement>) => void;
  "aria-label"?: string;
  "aria-describedby"?: string;
  children?: ReactNode;
};

function inputClassName(variant: InputVariant, className: string | undefined): string | undefined {
  if (variant === "default") {
    return className;
  }

  return ["input", variant === "file" ? "is-fullwidth" : "", className].filter(Boolean).join(" ");
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = "default", className, ...props },
  ref,
) {
  const resolvedClassName = inputClassName(variant, className);

  if (variant === "form" || variant === "file") {
    return (
      <div className="control">
        <input ref={ref} className={resolvedClassName} {...props} />
      </div>
    );
  }

  return <input ref={ref} className={resolvedClassName} {...props} />;
});
