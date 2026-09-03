import type { LayoutParagraphProps } from "@/components/layout/html-props";

export function FormError({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="form-error" {...props}>
      {children}
    </p>
  );
}
