import { logger } from "@/system/logging/logger";

type ApiHandler = (request: Request, context: unknown) => Response | Promise<Response>;

function requestPath(request: Request): string {
  return new URL(request.url).pathname;
}

function isQuietPath(path: string): boolean {
  return path.endsWith("/api/health") || path.includes("/api/health");
}

/**
 * Wraps App Router handlers with structured access / error logs (stdout → journald).
 */
export function withApiLog(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const started = Date.now();
    const method = request.method;
    const path = requestPath(request);

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - started;
      const status = response.status;
      const fields = { method, path, status, durationMs };

      if (status >= 500) {
        logger.error("http.request", fields);
      } else if (status >= 400) {
        logger.warn("http.request", fields);
      } else if (isQuietPath(path)) {
        logger.debug("http.request", fields);
      } else {
        logger.info("http.request", fields);
      }

      return response;
    } catch (error) {
      logger.error("http.unhandled", {
        method,
        path,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };
}
