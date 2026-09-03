import { requireAdminApi } from "@/system/auth/require-admin";
import { withApiLog } from "@/system/logging/with-api-log";

type ApiHandler = (request: Request, context: unknown) => Response | Promise<Response>;

/**
 * Access logs + admin session gate for protected admin API routes.
 */
export function withAdminApiLog(handler: ApiHandler): ApiHandler {
  return withApiLog(async (request, context) => {
    const unauthorized = await requireAdminApi();
    if (unauthorized) {
      return unauthorized;
    }
    return handler(request, context);
  });
}
