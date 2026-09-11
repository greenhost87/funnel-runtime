"use server";

import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminCookieOptions,
  verifyAdminPassword,
} from "@/system/auth/admin-session";
import { clearAdminSessionCookie } from "@/system/auth/clear-admin-session-cookie";
import { requireAdminAction } from "@/system/auth/require-admin";
import { createAnalyticsService } from "@/system/analytics/analytics.service";
import type { AnalyticsDashboard } from "@/system/analytics/analytics.service";
import type { AnalyticsFilters } from "@/system/database/analytics/analytics.dao";
import { getDatabase } from "@/system/database/connection";
import {
  LoginRequestSchema,
  RollbackRequestSchema,
  TrafficGenerateRequestSchema,
  TrafficGenerateResponseSchema,
  VersionsListResponseSchema,
} from "@/system/funnel/api-response.schema";
import type { FunnelVariant } from "@/system/funnel/config.types";
import { runTrafficGeneration } from "@/system/generator/run-traffic-generation";
import { actionErr, actionOk, type ActionResult } from "@/system/http/action-result";
import { logger } from "@/system/logging/logger";
import { createVersionService } from "@/system/versions/version.service";
import type { ActiveVersionSnapshot } from "@/system/versions/version.service";
import {
  parseFunnelConfigUpload,
  publishParsedFunnelConfig,
  rollbackFunnelVersion,
} from "@/system/versions/version-mutations";
import * as v from "valibot";

export async function adminLoginAction(password: string): Promise<ActionResult<{ ok: true }>> {
  const body = v.parse(LoginRequestSchema, { password });
  if (!verifyAdminPassword(body.password)) {
    logger.warn("admin.login", { result: "failure" });
    return actionErr("Invalid credentials");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), getAdminCookieOptions());
  logger.info("admin.login", { result: "success" });
  return actionOk({ ok: true });
}

export async function adminLogoutAction(): Promise<ActionResult<{ ok: true }>> {
  const store = await cookies();
  clearAdminSessionCookie(store);
  return actionOk({ ok: true });
}

export async function listVersionsAction(): Promise<
  ActionResult<v.InferOutput<typeof VersionsListResponseSchema>>
> {
  const unauthorized = await requireAdminAction();
  if (unauthorized) {
    return unauthorized;
  }
  const service = createVersionService(getDatabase());
  return actionOk(
    v.parse(VersionsListResponseSchema, {
      active: service.getActive(),
      history: service.getHistory(),
    }),
  );
}

export async function publishVersionAction(
  formData: FormData,
): Promise<ActionResult<{ active: ActiveVersionSnapshot }>> {
  const unauthorized = await requireAdminAction();
  if (unauthorized) {
    return unauthorized;
  }

  const file = formData.get("config");
  if (!(file instanceof File)) {
    return actionErr("config file is required");
  }

  try {
    const config = await parseFunnelConfigUpload(file);
    return actionOk({ active: publishParsedFunnelConfig(getDatabase(), config) });
  } catch (error) {
    return actionErr(error instanceof Error ? error.message : "Invalid config");
  }
}

export async function rollbackVersionAction(
  versionId: string,
): Promise<ActionResult<{ active: ActiveVersionSnapshot }>> {
  const unauthorized = await requireAdminAction();
  if (unauthorized) {
    return unauthorized;
  }

  const body = v.parse(RollbackRequestSchema, { versionId });
  try {
    return actionOk({ active: rollbackFunnelVersion(getDatabase(), body.versionId) });
  } catch (error) {
    return actionErr(error instanceof Error ? error.message : "Rollback failed");
  }
}

export type AnalyticsFilterInput = {
  campaign?: string;
  variant?: string;
  versionId?: string;
  dateFrom?: string;
  dateTo?: string;
};

function toAnalyticsFilters(input: AnalyticsFilterInput): AnalyticsFilters {
  const filters: AnalyticsFilters = {};
  if (input.campaign) {
    filters.utmCampaign = input.campaign;
  }
  if (input.variant === "A" || input.variant === "B") {
    filters.variant = input.variant satisfies FunnelVariant;
  }
  if (input.versionId) {
    filters.versionId = input.versionId;
  }
  if (input.dateFrom) {
    filters.dateFrom = input.dateFrom;
  }
  if (input.dateTo) {
    filters.dateTo = input.dateTo;
  }
  return filters;
}

export async function getAnalyticsDashboardAction(
  filters: AnalyticsFilterInput = {},
): Promise<ActionResult<AnalyticsDashboard>> {
  const unauthorized = await requireAdminAction();
  if (unauthorized) {
    return unauthorized;
  }
  const service = createAnalyticsService(getDatabase());
  return actionOk(service.getDashboard(toAnalyticsFilters(filters)));
}

export async function generateTrafficAction(input: {
  versionId: string;
  sessions: number;
  date: string;
}): Promise<ActionResult<v.InferOutput<typeof TrafficGenerateResponseSchema>>> {
  const unauthorized = await requireAdminAction();
  if (unauthorized) {
    return unauthorized;
  }

  let body;
  try {
    body = v.parse(TrafficGenerateRequestSchema, input);
  } catch {
    return actionErr("Invalid request");
  }

  const result = await runTrafficGeneration(getDatabase(), body);
  if (!result.ok) {
    return actionErr(result.error);
  }
  return actionOk(
    v.parse(TrafficGenerateResponseSchema, { generatedSessions: result.generatedSessions }),
  );
}
