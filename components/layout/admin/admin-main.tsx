import type { LayoutMainProps } from "@/components/layout/html-props";

export function AdminMain({ children, ...props }: LayoutMainProps) {
  return (
    <main className="admin-main" {...props}>
      {children}
    </main>
  );
}
