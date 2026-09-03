import { getDatabase } from "@/system/database/connection";
import { BatchEventSchema } from "@/system/events/event.schema";
import { createEventService } from "@/system/events/event.service";
import { jsonResponse, parseJsonFromReadable } from "@/system/http/json";

export async function POST(request: Request) {
  let items;
  try {
    const body = await parseJsonFromReadable(request, BatchEventSchema);
    items = body.events;
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid batch payload" },
      { status: 400 },
    );
  }

  const service = createEventService(getDatabase());
  const results = service.processBatch(items);
  return jsonResponse({ results });
}
