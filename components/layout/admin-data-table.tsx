import type { ReactNode } from "react";
import { DtHeader } from "@/components/ui/dt-table/dt-table";

type AdminDataTableProps = {
  columns: readonly string[];
  children: ReactNode;
};

export function AdminDataTable({ columns, children }: AdminDataTableProps) {
  return (
    <div className="analytics-table-wrap">
      <div className="dt">
        <DtHeader columns={columns} />
        {children}
      </div>
    </div>
  );
}
