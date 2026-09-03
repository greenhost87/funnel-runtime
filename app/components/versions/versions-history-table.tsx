"use client";

import { SecondaryActionButton } from "@/components/ui/secondary-action-button";
import { StatusTag } from "@/components/ui/status-tag";
import { VersionsHistoryRow } from "@/components/layout/admin/versions-history-row";
import { DtCell, DtHeader, DtTable } from "@/components/ui/dt-table/dt-table";
import { AnalyticsEmpty } from "@/components/layout/analytics/analytics-empty";
import { AnalyticsTableWrap } from "@/components/layout/analytics/analytics-table-wrap";

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
