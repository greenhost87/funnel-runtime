import type { LayoutDivProps } from "@/components/layout/html-props";

export function AdminValidationErrors({ children, ...props }: LayoutDivProps) {
  return (
    <div className="admin-validation-errors" {...props}>
      {children}
    </div>
  );
}
