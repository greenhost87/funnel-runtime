"use client";

import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { PrimarySubmitButton } from "@/components/ui/primary-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Option } from "@/components/ui/option";
import { Select } from "@/components/ui/select";
import { AdminCard } from "@/components/layout/class-tagged";
import { AdminErrorList } from "@/components/layout/admin/admin-error-list";
import { AdminCardTitle } from "@/components/layout/admin-card-title";
import { AnalyticsEmpty } from "@/components/layout/analytics/analytics-empty";
import { FormField } from "@/components/layout/form-field";
import { readAdminErrors } from "@/app/admin/admin-api";
import { TrafficGenerateResponseSchema } from "@/system/funnel/api-response.schema";
import { parseJsonFromReadable } from "@/system/http/json";

type VersionOption = {
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

type Props = {
  versions: VersionOption[];
  activeVersionId: string | null;
};

export function TrafficClient({ versions, activeVersionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function onGenerate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const versionId = formData.get("versionId");
    if (typeof versionId !== "string" || versionId.length === 0) {
      setErrors(["Funnel version is required"]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrors([]);
    setMessage(null);

    const response = await fetch("/api/admin/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        sessions: Number(formData.get("sessions")),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setErrors(await readAdminErrors(response));
      return;
    }

    const payload = await parseJsonFromReadable(response, TrafficGenerateResponseSchema);
    setMessage(`Generated ${payload.generatedSessions} synthetic sessions.`);
  }

  if (versions.length === 0) {
    return (
      <div>
        <AdminCardTitle>Test traffic</AdminCardTitle>
        <AdminCard>
          <AnalyticsEmpty>Publish a funnel version first.</AnalyticsEmpty>
        </AdminCard>
      </div>
    );
  }

  return (
    <div>
      <AdminCardTitle>Test traffic</AdminCardTitle>

      <AdminCard>
        <p>
          Generate random synthetic sessions for a selected funnel version: UTM splits, A/B
          variants, drop-offs, duplicate batches, and out-of-order events.
        </p>

        <form
          onSubmit={(event) => {
            void onGenerate(event);
          }}
        >
          <FormField>
            <Label htmlFor="versionId">Funnel version</Label>
            <Select id="versionId" name="versionId" defaultValue={activeVersionId ?? versions[0]?.versionId} required>
              {versions.map((version) => (
                <Option key={version.versionId} value={version.versionId}>
                  {version.configId}
                  {version.isActive ? " (active)" : ""} — {version.activatedAt}
                </Option>
              ))}
            </Select>
          </FormField>
          <FormField>
            <Label htmlFor="sessions">Sessions (min 100)</Label>
            <Input id="sessions" name="sessions" type="number" defaultValue={120} min={100} required />
          </FormField>
          <PrimarySubmitButton loading={loading} loadingLabel="Generating…">
            Generate traffic
          </PrimarySubmitButton>
        </form>

        {message ? (
          <p>
            {message} <Link href="/admin/analytics">Open analytics</Link>
          </p>
        ) : null}

        <AdminErrorList errors={errors} />
      </AdminCard>
    </div>
  );
}
