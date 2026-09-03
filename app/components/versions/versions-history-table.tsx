"use client";

import { SecondaryActionButton } from "@/components/ui/action-buttons";
import { StatusTag } from "@/components/ui/primitives";
import { VersionsHistoryRow } from "@/components/layout/admin-primitives";
import { DtCell, DtHeader, DtTable } from "@/components/ui/dt-table/dt-table";
import { AnalyticsEmpty, AnalyticsTableWrap } from "@/components/layout/analytics-primitives";

type HistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

type VersionsHistoryTableProps = {
  history: HistoryItem[];
  loading: boolean;
  onRollback: (versionId: string) => void;
};

const headers = ["Config ID", "Version ID", "Activated", "Status", "Action"] as const;

export function VersionsHistoryTable({ history, loading, onRollback }: VersionsHistoryTableProps) {
  if (history.length === 0) {
    return <AnalyticsEmpty>No activation history yet.</AnalyticsEmpty>;
  }

  return (
    <AnalyticsTableWrap>
      <DtTable>
        <DtHeader columns={headers} />
        {history.map((item) => (
          <VersionsHistoryRow key={item.activationId} active={item.isActive}>
            <DtCell label="Config ID">{item.configId}</DtCell>
            <DtCell label="Version ID">{item.versionId}</DtCell>
            <DtCell label="Activated">{item.activatedAt}</DtCell>
            <DtCell label="Status">
              {item.isActive ? <StatusTag>Active</StatusTag> : "Inactive"}
            </DtCell>
            <DtCell label="Action">
              {!item.isActive ? (
                <SecondaryActionButton
                  loading={loading}
                  loadingLabel="Rolling back…"
                  onClick={() => {
                    onRollback(item.versionId);
                  }}
                >
                  Rollback
                </SecondaryActionButton>
              ) : (
                "—"
              )}
            </DtCell>
          </VersionsHistoryRow>
        ))}
      </DtTable>
    </AnalyticsTableWrap>
  );
}
