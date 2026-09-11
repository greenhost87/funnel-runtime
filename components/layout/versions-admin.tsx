"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { PrimarySubmitButton } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/layout/class-tagged";
import { AdminCardEmpty, AdminCardWithErrors } from "@/components/layout/admin-primitives";
import { AdminDataTable } from "@/components/layout/admin-data-table";
import { AdminCardTitle, TextField } from "@/components/ui/form";
import { DtCell } from "@/components/ui/dt-table/dt-table";
import { adminErrorsFromAction } from "@/app/admin/read-admin-errors";
import {
  hydrateVersionsAdminState,
  loadVersionsAdminState,
} from "@/app/admin/load-versions-admin-state";
import { publishVersionAction, rollbackVersionAction } from "@/app/actions/admin";
import type { ActionResult } from "@/system/http/action-result";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";

type HistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

const HISTORY_COLUMNS = ["Activated", "Config", "Version", "Status", "Actions"] as const;

async function refreshVersionsState(
  setActive: (value: ActiveVersionSnapshot | null) => void,
  setHistory: (value: HistoryItem[]) => void,
) {
  const payload = await loadVersionsAdminState();
  if (!payload.ok) {
    throw new Error(payload.error);
  }
  setActive(payload.active);
  setHistory(payload.history);
}

async function runVersionsMutation<TData>(
  setLoading: (value: boolean) => void,
  setErrors: (value: string[]) => void,
  mutate: () => Promise<ActionResult<TData>>,
  onSuccess: () => Promise<void>,
) {
  setLoading(true);
  setErrors([]);
  const result = await mutate();
  setLoading(false);
  if (!result.ok) {
    setErrors(adminErrorsFromAction(result));
    return;
  }
  await onSuccess();
}

export function VersionsClient() {
  const [active, setActive] = useState<ActiveVersionSnapshot | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void hydrateVersionsAdminState({
      onError: (error) => {
        setErrors([error]);
        setHistory([]);
      },
      onSuccess: (nextActive, nextHistory) => {
        setActive(nextActive);
        setHistory(nextHistory);
      },
    });
  }, []);

  async function onPublish(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await runVersionsMutation(
      setLoading,
      setErrors,
      async () => publishVersionAction(new FormData(form)),
      async () => {
        await refreshVersionsState(setActive, setHistory);
        form.reset();
      },
    );
  }

  async function onRollback(versionId: string) {
    await runVersionsMutation(
      setLoading,
      setErrors,
      async () => rollbackVersionAction(versionId),
      async () => refreshVersionsState(setActive, setHistory),
    );
  }

  if (history === null) {
    return (
      <div>
        <AdminCardTitle>Funnel versions</AdminCardTitle>
        <AdminCardEmpty message="Loading versions…" />
      </div>
    );
  }

  return (
    <div>
      <AdminCardTitle>Funnel versions</AdminCardTitle>

      <AdminCard>
        <AdminCardTitle as="h2">Active version</AdminCardTitle>
        {active ? (
          <div>
            <p>
              <strong>Version ID:</strong> {active.versionId}
            </p>
            <p>
              <strong>Config ID:</strong> {active.configId}
            </p>
            <p>
              <strong>Activated:</strong> {active.activatedAt}
            </p>
          </div>
        ) : (
          <p>No active version yet.</p>
        )}
      </AdminCard>

      <AdminCardWithErrors errors={errors}>
        <AdminCardTitle as="h2">Publish JSON config</AdminCardTitle>
        <form
          onSubmit={(event) => {
            void onPublish(event);
          }}
        >
          <TextField
            id="config"
            label="Local JSON file"
            variant="file"
            type="file"
            name="config"
            accept="application/json,.json"
            required
          />
          <PrimarySubmitButton disabled={loading}>Publish</PrimarySubmitButton>
        </form>
      </AdminCardWithErrors>

      <AdminCard>
        <AdminCardTitle as="h2">Activation history</AdminCardTitle>
        {history.length === 0 ? (
          <p className="analytics-empty">No activation history yet.</p>
        ) : (
          <AdminDataTable columns={HISTORY_COLUMNS}>
            {history.map((item) => (
              <div
                key={item.activationId}
                className={item.isActive ? "versions-history__row--active" : undefined}
              >
                <DtCell label="Activated">{item.activatedAt}</DtCell>
                <DtCell label="Config">{item.configId}</DtCell>
                <DtCell label="Version">{item.versionId}</DtCell>
                <DtCell label="Status">{item.isActive ? "Active" : "Previous"}</DtCell>
                <DtCell label="Actions">
                  {item.isActive ? null : (
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        void onRollback(item.versionId);
                      }}
                    >
                      Rollback
                    </Button>
                  )}
                </DtCell>
              </div>
            ))}
          </AdminDataTable>
        )}
      </AdminCard>
    </div>
  );
}
