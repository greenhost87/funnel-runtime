"use client";

import { useState, type SyntheticEvent } from "react";
import { PrimarySubmitButton } from "@/components/ui/primary-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCard } from "@/components/layout/class-tagged";
import { VersionsHistoryTable } from "@/app/components/versions/versions-history-table";
import { AdminErrorList } from "@/components/layout/admin/admin-error-list";
import { AdminCardTitle } from "@/components/layout/admin-card-title";
import { AnalyticsEmpty } from "@/components/layout/analytics/analytics-empty";
import { FormField } from "@/components/layout/form-field";
import { readAdminErrors } from "@/app/admin/admin-api";
import { VersionsListResponseSchema } from "@/system/funnel/api-response.schema";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";
import { parseJsonFromReadable } from "@/system/http/json";

type HistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

type Props = {
  initialActive: ActiveVersionSnapshot | null;
  initialHistory: HistoryItem[];
};

async function loadVersionsState() {
  const response = await fetch("/api/admin/versions");
  return parseJsonFromReadable(response, VersionsListResponseSchema);
}

async function refreshVersionsState(
  setActive: (value: ActiveVersionSnapshot | null) => void,
  setHistory: (value: HistoryItem[]) => void,
) {
  const payload = await loadVersionsState();
  setActive(payload.active);
  setHistory(payload.history);
}

async function runVersionsMutation(
  setLoading: (value: boolean) => void,
  setErrors: (value: string[]) => void,
  fetcher: () => Promise<Response>,
  onSuccess: () => Promise<void>,
) {
  setLoading(true);
  setErrors([]);
  const response = await fetcher();
  setLoading(false);
  if (!response.ok) {
    setErrors(await readAdminErrors(response));
    return;
  }
  await onSuccess();
}

export function VersionsClient({ initialActive, initialHistory }: Props) {
  const [active, setActive] = useState(initialActive);
  const [history, setHistory] = useState(initialHistory);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onPublish(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await runVersionsMutation(
      setLoading,
      setErrors,
      async () => fetch("/api/admin/versions", { method: "POST", body: new FormData(form) }),
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
      async () =>
        fetch("/api/admin/versions/rollback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId }),
        }),
      async () => refreshVersionsState(setActive, setHistory),
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
          <AnalyticsEmpty>No active version yet.</AnalyticsEmpty>
        )}
      </AdminCard>

      <AdminCard>
        <AdminCardTitle as="h2">Publish JSON config</AdminCardTitle>
        <form
          onSubmit={(event) => {
            void onPublish(event);
          }}
        >
          <FormField>
            <Label htmlFor="config">Local JSON file</Label>
            <Input
              id="config"
              variant="file"
              type="file"
              name="config"
              accept="application/json,.json"
              required
            />
          </FormField>
          <PrimarySubmitButton loading={loading}>Publish</PrimarySubmitButton>
        </form>
        {errors.length > 0 ? <AdminErrorList errors={errors} /> : null}
      </AdminCard>

      <AdminCard>
        <AdminCardTitle as="h2">Activation history</AdminCardTitle>
        <VersionsHistoryTable
          history={history}
          loading={loading}
          onRollback={(versionId) => {
            void onRollback(versionId);
          }}
        />
      </AdminCard>
    </div>
  );
}
