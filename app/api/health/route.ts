import { jsonResponse } from "@/system/http/json";
import { withApiLog } from "@/system/logging/with-api-log";

export const GET = withApiLog(function GET() {
  return jsonResponse({ status: "healthy" });
});
