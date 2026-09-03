import { afterEach, expect, test } from "bun:test";
import { logger } from "@/system/logging/logger";
import { setEnv } from "@/system/config/environment";

afterEach(() => {
  setEnv("LOG_LEVEL", undefined);
  setEnv("NODE_ENV", "test");
});

test("logger writes json lines outside test when enabled", () => {
  setEnv("NODE_ENV", "development");
  setEnv("LOG_LEVEL", "info");

  const lines: string[] = [];
  const original = console.info;
  console.info = (...args: Array<string | number | boolean | null | undefined>) => {
    lines.push(String(args[1] ?? args[0]));
  };

  try {
    logger.info("http.request", { method: "GET", path: "/api/health", status: 200 });
  } finally {
    console.info = original;
    setEnv("NODE_ENV", "test");
  }

  expect(lines).toHaveLength(1);
  const line = lines[0];
  if (!line) {
    throw new Error("expected a log line");
  }
  const payload: unknown = JSON.parse(line);
  expect(payload).toMatchObject({
    msg: "http.request",
    level: "info",
    status: 200,
  });
});
