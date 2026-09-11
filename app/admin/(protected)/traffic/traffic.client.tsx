"use client";

import Link from "next/link";
import { useEffect, useState, type SyntheticEvent } from "react";
import { PrimarySubmitButton } from "@/components/ui/action-buttons";
import { Select } from "@/components/ui/select";
import { AdminCardEmpty, AdminCardWithErrors } from "@/components/layout/admin-primitives";
import { AdminCardTitle, DateField } from "@/components/ui/form";
import { AnalyticsEmpty } from "@/components/ui/analytics-shell";
import { adminErrorsFromAction } from "@/app/admin/read-admin-errors";
import { hydrateVersionsAdminState } from "@/app/admin/load-versions-admin-state";
import { generateTrafficAction } from "@/app/actions/admin";

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

export function TrafficClient() {
  const [versions, setVersions] = useState<VersionOption[] | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    void hydrateVersionsAdminState({
      onError: (error) => {
        setErrors([error]);
        setVersions([]);
      },
      onSuccess: (active, history) => {
        setVersions(history);
        setActiveVersionId(active?.versionId ?? null);
      },
    });
  }, []);

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

    const result = await generateTrafficAction({
      versionId,
      sessions: Number(formData.get("sessionPreset")),
      date,
    });

    setLoading(false);

    if (!result.ok) {
      setErrors(adminErrorsFromAction(result));
      return;
    }

    setMessage(`Generated ${result.data.generatedSessions} synthetic sessions for ${date}.`);
  }

  if (versions === null) {
    return (
      <div>
        <AdminCardTitle>Test traffic</AdminCardTitle>
        <AdminCardEmpty message="Loading versions…" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div>
        <AdminCardTitle>Test traffic</AdminCardTitle>
        {errors.length > 0 ? (
          <AdminCardWithErrors errors={errors}>
            <AnalyticsEmpty>Publish a funnel version first.</AnalyticsEmpty>
          </AdminCardWithErrors>
        ) : (
          <AdminCardEmpty message="Publish a funnel version first." />
        )}
      </div>
    );
  }

  return (
    <div>
      <AdminCardTitle>Test traffic</AdminCardTitle>

      <AdminCardWithErrors errors={errors}>
        <p>
          Generate random synthetic sessions for a selected funnel version: UTM splits, A/B
          variants, drop-offs, duplicate batches, and out-of-order events.
        </p>

        <form
          onSubmit={(event) => {
            void onGenerate(event);
          }}
        >
          <Select
            id="versionId"
            name="versionId"
            label="Funnel version"
            defaultValue={activeVersionId ?? versions[0]?.versionId}
            required
            options={versions.map((version) => ({
              value: version.versionId,
              label: `${version.configId}${version.isActive ? " (active)" : ""} — ${version.activatedAt}`,
            }))}
          />
          <Select
            id="sessionPreset"
            name="sessionPreset"
            label="Volume"
            defaultValue={500}
            required
            options={SESSION_PRESETS.map((preset) => ({
              value: String(preset.value),
              label: preset.label,
            }))}
          />
          <DateField
            id="date"
            name="date"
            label="Event date"
            defaultValue={todayIsoDate()}
            required
          />
          <PrimarySubmitButton disabled={loading}>
            {loading ? "Generating…" : "Generate traffic"}
          </PrimarySubmitButton>
        </form>

        {message ? (
          <p>
            {message} <Link href="/admin/analytics">Open analytics</Link>
          </p>
        ) : null}
      </AdminCardWithErrors>
    </div>
  );
}
