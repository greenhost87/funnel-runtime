import { listVersionsAction } from "@/app/actions/admin";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";

type HistoryItem = {
  activationId: number;
  versionId: string;
  configId: string;
  activatedAt: string;
  isActive: boolean;
};

export type VersionsAdminState =
  | { ok: true; active: ActiveVersionSnapshot | null; history: HistoryItem[] }
  | { ok: false; error: string };

export async function loadVersionsAdminState(): Promise<VersionsAdminState> {
  const result = await listVersionsAction();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return {
    ok: true,
    active: result.data.active,
    history: result.data.history,
  };
}

type VersionsLoadHandlers = {
  onError: (error: string) => void;
  onSuccess: (active: ActiveVersionSnapshot | null, history: HistoryItem[]) => void;
};

export async function hydrateVersionsAdminState(handlers: VersionsLoadHandlers): Promise<void> {
  const result = await loadVersionsAdminState();
  if (!result.ok) {
    handlers.onError(result.error);
    return;
  }
  handlers.onSuccess(result.active, result.history);
}
