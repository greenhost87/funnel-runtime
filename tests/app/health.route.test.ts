import { expect, test } from "bun:test";
import { GET } from "@/app/api/health/route";

test("health route returns healthy status", async () => {
  const response = await GET(new Request("http://127.0.0.1/api/health"), undefined);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "healthy" });
});
