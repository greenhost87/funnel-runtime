import type { ActionErr } from "@/system/http/action-result";

export function adminErrorsFromAction(result: ActionErr): string[] {
  return result.details && result.details.length > 0 ? result.details : [result.error];
}
