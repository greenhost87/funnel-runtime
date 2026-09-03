import { NextResponse } from "next/server";
import { requireAdminApi } from "@/system/auth/require-admin";
import { getDatabase } from "@/system/database/connection";
import { VersionService } from "@/system/versions/version.service";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json()) as { versionId?: string };
  if (!body.versionId) {
    return NextResponse.json({ error: "versionId is required" }, { status: 400 });
  }

  try {
    const service = new VersionService(getDatabase());
    const active = service.rollbackToVersion(body.versionId);
    return NextResponse.json({ active });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rollback failed" },
      { status: 400 },
    );
  }
}
