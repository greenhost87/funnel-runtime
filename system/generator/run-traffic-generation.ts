import type { Database } from "bun:sqlite";
import { generateSyntheticTraffic } from "@/system/generator/traffic-generator";
import { logger } from "@/system/logging/logger";
import { createVersionService } from "@/system/versions/version.service";

type TrafficGenerateBody = {
  versionId: string;
  sessions?: number;
  date?: string;
};

export async function runTrafficGeneration(
  db: Database,
  body: TrafficGenerateBody,
): Promise<{ ok: true; generatedSessions: number } | { ok: false; error: string }> {
  const sessionCount = body.sessions ?? 120;
  const versions = createVersionService(db);
  if (!versions.getHistory().some((item) => item.versionId === body.versionId)) {
    return { ok: false, error: "Unknown funnel version" };
  }

  const { generatedSessions } = await generateSyntheticTraffic(db, {
    versionId: body.versionId,
    sessionCount,
    anchorDate: body.date,
  });

  logger.info("admin.traffic.generate", {
    versionId: body.versionId,
    generatedSessions,
    date: body.date ?? null,
  });
  return { ok: true, generatedSessions };
}
