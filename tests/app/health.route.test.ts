import { expect, test } from 'bun:test';
import { GET } from '@/app/api/health/route';

test('health route returns healthy status', async () => {
  const response = GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'healthy' });
});
