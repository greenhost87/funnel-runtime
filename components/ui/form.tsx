import { type ChangeEvent, type ReactNode } from "react";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LayoutParagraphProps } from "@/components/ui/html-props";

export function FormError({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="help is-danger" {...props}>
      {children}
    </p>
  );
}

type FormFieldProps = {
  children: ReactNode;
};

export function FormField({ children }: FormFieldProps) {
  return <div className="field">{children}</div>;
}

type AdminCardTitleProps = {
  as?: "h1" | "h2";
  children: ReactNode;
};

export function AdminCardTitle({ as: Tag = "h1", children }: AdminCardTitleProps) {
  const className = Tag === "h1" ? "title is-4" : "title is-5 admin-card__title";
  return <Tag className={className}>{children}</Tag>;
}

type DateFieldProps = {
  id: string;
  label: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  onChange?: (nextValue: string) => void;
};

type TextFieldProps = {
  id: string;
  label: string;
  variant: "form" | "file";
  type?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  accept?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function DateField(props: DateFieldProps): ReactNode {
  return (
    <div className="field">
      <Label htmlFor={props.id}>{props.label}</Label>
      <DateInput
        id={props.id}
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        required={props.required}
        name={props.name}
        onChange={props.onChange}
      />
    </div>
  );
}

export function TextField(props: TextFieldProps): ReactNode {
  const input = (
    <Input
      id={props.id}
      variant={props.variant}
      type={props.type}
      name={props.name}
      value={props.value}
      disabled={props.disabled}
      required={props.required}
      autoComplete={props.autoComplete}
      accept={props.accept}
      onChange={props.onChange}
    />
  );

  return (
    <div className="field">
      <Label htmlFor={props.id}>{props.label}</Label>
      {input}
    </div>
  );
}
