import { ErrorResponseSchema } from "@/system/funnel/api-response.schema";
import { parseJsonFromReadable } from "@/system/http/json";

export async function readAdminErrors(response: Response): Promise<string[]> {
  const payload = await parseJsonFromReadable(response, ErrorResponseSchema);
  return payload.details && payload.details.length > 0 ? payload.details : [payload.error];
}
