import { NextResponse } from "next/server";
import { requireAdminApi } from "@/system/auth/require-admin";
import { getDatabase } from "@/system/database/connection";
import { safeParseFunnelConfig } from "@/system/funnel/config.schema";
import { VersionService } from "@/system/versions/version.service";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }
  const service = new VersionService(getDatabase());
  const active = service.getActive();
  const history = service.getHistory();
  return NextResponse.json({ active, history });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) {
    return unauthorized;
  }

  const formData = await request.formData();
  const file = formData.get("config");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "config file is required" }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
  }

  const validation = safeParseFunnelConfig(parsed);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Schema validation failed", details: validation.errors },
      { status: 400 },
    );
  }

  const service = new VersionService(getDatabase());
  const active = service.publish(validation.data);
  return NextResponse.json({ active });
}
