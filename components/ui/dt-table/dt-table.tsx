import type { ReactNode } from "react";

function joinClassNames(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function DtCell({ label, children }: { label: string; children?: ReactNode }) {
  return <div data-label={label}>{children}</div>;
}

export function DtHeader({ columns }: { columns: readonly string[] }) {
  return (
    <div>
      {columns.map((column, index) => (
        <div key={column.length > 0 ? column : `empty-${String(index)}`}>{column}</div>
      ))}
    </div>
  );
}

export function DtTable({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={joinClassNames("dt", className)}>{children}</div>;
}
