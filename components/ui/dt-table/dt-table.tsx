import type { ReactNode } from "react";

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
