"use client";

import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { PrimarySubmitButton } from "@/components/ui/action-buttons";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Option } from "@/components/ui/primitives";
import { Select } from "@/components/ui/select";
import { AdminCard } from "@/components/layout/class-tagged";
import { AdminErrorList } from "@/components/layout/admin-primitives";
import { AdminCardTitle, FormField } from "@/components/layout/primitives";
import { AnalyticsEmpty } from "@/components/layout/analytics-primitives";
import { withBasePath } from "@/system/config/base-path";
import { readAdminErrors } from "@/app/admin/read-admin-errors";
import { TrafficGenerateResponseSchema } from "@/system/funnel/api-response.schema";
import { parseJsonFromReadable } from "@/system/http/json";

const SESSION_PRESETS = [
  { value: 100, label: "100 — smoke test" },
  { value: 250, label: "250 — light load" },
  { value: 500, label: "500 — medium load" },
  { value: 1000, label: "1,000 — heavy load" },
  { value: 2000, label: "2,000 — stress test" },
] as const;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

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

    const date = formData.get("date");
    if (typeof date !== "string" || date.length === 0) {
      setErrors(["Event date is required"]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrors([]);
    setMessage(null);

    const response = await fetch(withBasePath("/api/admin/traffic"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        sessions: Number(formData.get("sessionPreset")),
        date,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setErrors(await readAdminErrors(response));
      return;
    }

    const payload = await parseJsonFromReadable(response, TrafficGenerateResponseSchema);
    setMessage(`Generated ${payload.generatedSessions} synthetic sessions for ${date}.`);
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
            <Select
              id="versionId"
              name="versionId"
              defaultValue={activeVersionId ?? versions[0]?.versionId}
              required
            >
              {versions.map((version) => (
                <Option key={version.versionId} value={version.versionId}>
                  {version.configId}
                  {version.isActive ? " (active)" : ""} — {version.activatedAt}
                </Option>
              ))}
            </Select>
          </FormField>
          <FormField>
            <Label htmlFor="sessionPreset">Volume</Label>
            <Select id="sessionPreset" name="sessionPreset" defaultValue={500} required>
              {SESSION_PRESETS.map((preset) => (
                <Option key={preset.value} value={preset.value}>
                  {preset.label}
                </Option>
              ))}
            </Select>
          </FormField>
          <FormField>
            <Label htmlFor="date">Event date</Label>
            <DateInput id="date" name="date" defaultValue={todayIsoDate()} required />
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
