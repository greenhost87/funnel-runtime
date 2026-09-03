import type { ReactNode } from "react";

type VersionsHistoryRowProps = {
  active?: boolean;
  children: ReactNode;
};

function versionsHistoryRowClassName(active?: boolean): string | undefined {
  return active ? "versions-history__row--active" : undefined;
}

export function VersionsHistoryRow({ active, children }: VersionsHistoryRowProps) {
  return <div className={versionsHistoryRowClassName(active)}>{children}</div>;
}
