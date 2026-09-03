import type { LayoutParagraphProps } from "@/components/layout/html-props";

export function FormError({ children, ...props }: LayoutParagraphProps) {
  return (
    <p className="help is-danger" {...props}>
      {children}
    </p>
  );
}
