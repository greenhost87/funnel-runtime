"use client";

import { useState, type SyntheticEvent } from "react";
import { SecondaryActionButton } from "@/components/ui/secondary-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCard, AdminHistoryItem } from "@/components/layout/class-tagged";
import { AdminHistory } from "@/components/layout/admin/admin-history";
import { AdminValidationErrors } from "@/components/layout/admin/admin-validation-errors";
import { AdminCardTitle } from "@/components/layout/admin-card-title";
import { AnalyticsEmpty } from "@/components/layout/analytics/analytics-empty";
import { FormField } from "@/components/layout/form-field";
import {
  ErrorResponseSchema,
  VersionsListResponseSchema,
} from "@/system/funnel/api-response.schema";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";
import { parseJsonFromReadable } from "@/system/http/json";

type HistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

function renderValidationErrors(errors: readonly string[]) {
  return (
    <AdminValidationErrors>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </AdminValidationErrors>
  );
}

type Props = {
  initialActive: ActiveVersionSnapshot | null;
  initialHistory: HistoryItem[];
};

async function loadVersionsState() {
  const response = await fetch("/api/admin/versions");
  return parseJsonFromReadable(response, VersionsListResponseSchema);
}

async function readAdminErrors(response: Response): Promise<string[]> {
  const payload = await parseJsonFromReadable(response, ErrorResponseSchema);
  return payload.details && payload.details.length > 0 ? payload.details : [payload.error];
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
          <Button variant="primary" type="submit" disabled={loading}>
            Publish
          </Button>
        </form>
        {errors.length > 0 ? renderValidationErrors(errors) : null}
      </AdminCard>

      <AdminCard>
        <AdminCardTitle as="h2">Activation history</AdminCardTitle>
        <AdminHistory>
          {history.map((item) => (
            <AdminHistoryItem key={item.activationId} active={item.isActive}>
              <div>
                <strong>{item.configId}</strong>
                <div>{item.versionId}</div>
                <div>{item.activatedAt}</div>
              </div>
              {!item.isActive ? (
                <SecondaryActionButton
                  loading={loading}
                  loadingLabel="Rolling back…"
                  onClick={() => void onRollback(item.versionId)}
                >
                  Rollback
                </SecondaryActionButton>
              ) : (
                <span>Active</span>
              )}
            </AdminHistoryItem>
          ))}
        </AdminHistory>
      </AdminCard>
    </div>
  );
}
