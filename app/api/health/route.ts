import { jsonResponse } from '@/system/http/json';

export function GET() {
  return jsonResponse({ status: 'healthy' });
}
