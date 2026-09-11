import { ErrorResponseSchema } from "@/system/funnel/api-response.schema";
import { parseJsonFromReadable } from "@/system/http/json";
import type { GenericSchema, InferOutput } from "valibot";

export type ActionOk<T> = { ok: true; data: T };

export type ActionErr = {
  ok: false;
  error: string;
  details?: string[];
};

export type ActionResult<T> = ActionOk<T> | ActionErr;

export function actionOk<T>(data: T): ActionOk<T> {
  return { ok: true, data };
}

export function actionErr(error: string, details?: string[]): ActionErr {
  return details && details.length > 0 ? { ok: false, error, details } : { ok: false, error };
}

export async function actionResultFromResponse<const TSchema extends GenericSchema>(
  response: Response,
  schema: TSchema,
): Promise<ActionResult<InferOutput<TSchema>>> {
  if (!response.ok) {
    try {
      const payload = await parseJsonFromReadable(response, ErrorResponseSchema);
      return actionErr(
        payload.error,
        payload.details && payload.details.length > 0 ? payload.details : undefined,
      );
    } catch {
      return actionErr(`Request failed (${response.status})`);
    }
  }
  return actionOk(await parseJsonFromReadable(response, schema));
}
