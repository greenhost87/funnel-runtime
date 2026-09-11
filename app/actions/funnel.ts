"use server";

import type { Database } from "bun:sqlite";
import { getDatabase } from "@/system/database/connection";
import {
  AnswerRequestSchema,
  FunnelApiStateSchema,
  MutationResponseSchema,
} from "@/system/funnel/api-response.schema";
import type { FunnelApiState, MutationResponse } from "@/system/funnel/api-response.schema";
import type { StepAnswer } from "@/system/funnel/config.types";
import { actionOk, actionResultFromResponse, type ActionResult } from "@/system/http/action-result";
import { createOrRestoreFunnelSession } from "@/system/http/create-or-restore-funnel-session";
import {
  getSessionIdFromCookie,
  handleAdvanceMutation,
  handleBackMutation,
  runAnswerSessionMutation,
  runSessionMutation,
  setSessionIdCookie,
} from "@/system/http/funnel-api.helpers";
import * as v from "valibot";

function parseQuery(query: string): URLSearchParams {
  const normalized = query.startsWith("?") ? query.slice(1) : query;
  return new URLSearchParams(normalized);
}

async function runFunnelMutationAction(
  mutate: (db: Database, sessionId: string) => Response,
): Promise<ActionResult<MutationResponse>> {
  const response = await runSessionMutation(getDatabase(), mutate);
  return actionResultFromResponse(response, MutationResponseSchema);
}

export async function loadFunnelSessionAction(query = ""): Promise<ActionResult<FunnelApiState>> {
  const existingId = await getSessionIdFromCookie();
  const restored = createOrRestoreFunnelSession(getDatabase(), existingId, parseQuery(query));
  if (restored.shouldSetCookie) {
    await setSessionIdCookie(restored.snapshotSessionId);
  }
  return actionOk(v.parse(FunnelApiStateSchema, restored.state));
}

export async function submitFunnelAnswerAction(
  stepId: string,
  answer: StepAnswer | null,
): Promise<ActionResult<MutationResponse>> {
  const body = v.parse(AnswerRequestSchema, { stepId, answer: answer ?? undefined });
  const response = await runAnswerSessionMutation(getDatabase(), body.stepId, body.answer);
  return actionResultFromResponse(response, MutationResponseSchema);
}

export async function advanceFunnelStepAction(): Promise<ActionResult<MutationResponse>> {
  return runFunnelMutationAction(handleAdvanceMutation);
}

export async function goBackFunnelAction(): Promise<ActionResult<MutationResponse>> {
  return runFunnelMutationAction(handleBackMutation);
}
