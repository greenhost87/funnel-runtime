import { NextResponse } from "next/server";
import { getDatabase } from "@/system/database/connection";
import { parseBatchEvents } from "@/system/events/event.schema";
import { EventService } from "@/system/events/event.service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let items;
  try {
    items = parseBatchEvents(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid batch payload" },
      { status: 400 },
    );
  }

  const service = new EventService(getDatabase());
  const results = service.processBatch(items);
  return NextResponse.json({ results });
}
