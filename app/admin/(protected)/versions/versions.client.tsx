"use client";

import { FormEvent, useState } from "react";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";

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

export function VersionsClient({ initialActive, initialHistory }: Props) {
  const [active, setActive] = useState(initialActive);
  const [history, setHistory] = useState(initialHistory);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function refreshState() {
    const response = await fetch("/api/admin/versions");
    const payload = (await response.json()) as {
      active: ActiveVersionSnapshot | null;
      history: HistoryItem[];
    };
    setActive(payload.active);
    setHistory(payload.history);
  }

  async function onPublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors([]);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/versions", { method: "POST", body: formData });
    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { details?: string[]; error?: string };
      setErrors(payload.details ?? [payload.error ?? "Publication failed"]);
      return;
    }
    await refreshState();
    event.currentTarget.reset();
  }

  async function onRollback(versionId: string) {
    setLoading(true);
    setErrors([]);
    const response = await fetch("/api/admin/versions/rollback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrors([payload.error ?? "Rollback failed"]);
      return;
    }
    await refreshState();
  }

  return (
    <div>
      <h1 className="admin-card__title">Funnel versions</h1>

      <section className="admin-card">
        <h2 className="admin-card__title">Active version</h2>
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
          <p className="analytics-empty">No active version yet.</p>
        )}
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Publish JSON config</h2>
        <form onSubmit={onPublish}>
          <div className="form-field">
            <label className="form-label" htmlFor="config">
              Local JSON file
            </label>
            <input
              id="config"
              className="form-file"
              type="file"
              name="config"
              accept="application/json,.json"
              required
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            Publish
          </button>
        </form>
        {errors.length > 0 ? (
          <div className="admin-validation-errors">
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Activation history</h2>
        <div className="admin-history">
          {history.map((item) => (
            <div
              key={item.activationId}
              className={`admin-history__item${item.isActive ? " admin-history__item--active" : ""}`}
            >
              <div>
                <strong>{item.configId}</strong>
                <div>{item.versionId}</div>
                <div>{item.activatedAt}</div>
              </div>
              {!item.isActive ? (
                <button
                  className="btn btn--secondary"
                  type="button"
                  disabled={loading}
                  onClick={() => void onRollback(item.versionId)}
                >
                  Rollback
                </button>
              ) : (
                <span>Active</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
