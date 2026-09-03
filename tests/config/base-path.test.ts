import { afterEach, expect, test } from "bun:test";
import { getCookiePath, normalizeBasePath, withBasePath } from "@/system/config/base-path";
import { setEnv } from "@/system/config/environment";

afterEach(() => {
  setEnv("BASE_PATH", undefined);
  setEnv("NEXT_PUBLIC_BASE_PATH", undefined);
});

test("normalizeBasePath strips trailing slashes and adds a leading slash", () => {
  expect(normalizeBasePath(undefined)).toBe("");
  expect(normalizeBasePath("")).toBe("");
  expect(normalizeBasePath("/")).toBe("");
  expect(normalizeBasePath("/some-bullshit")).toBe("/some-bullshit");
  expect(normalizeBasePath("/some-bullshit/")).toBe("/some-bullshit");
  expect(normalizeBasePath("some-bullshit")).toBe("/some-bullshit");
});

test("withBasePath prefixes absolute paths", () => {
  setEnv("BASE_PATH", "/some-bullshit");
  expect(withBasePath("/api/health")).toBe("/some-bullshit/api/health");
  expect(withBasePath("/")).toBe("/some-bullshit");
  expect(getCookiePath()).toBe("/some-bullshit");
});

test("withBasePath is a no-op without BASE_PATH", () => {
  expect(withBasePath("/api/health")).toBe("/api/health");
  expect(getCookiePath()).toBe("/");
});

test("NEXT_PUBLIC_BASE_PATH wins over BASE_PATH for server rendering", () => {
  setEnv("BASE_PATH", "/from-server");
  setEnv("NEXT_PUBLIC_BASE_PATH", "/from-build");
  expect(withBasePath("/api/health")).toBe("/from-build/api/health");
});

test("withBasePath reads the rendered base path in the browser", () => {
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { documentElement: { dataset: { basePath: "/from-document" } } },
  });

  try {
    expect(withBasePath("/api/admin/login")).toBe("/from-document/api/admin/login");
    expect(withBasePath("/api/funnel/session")).toBe("/from-document/api/funnel/session");
    expect(withBasePath("/api/events")).toBe("/from-document/api/events");
  } finally {
    if (documentDescriptor) {
      Object.defineProperty(globalThis, "document", documentDescriptor);
    } else {
      delete (globalThis as { document?: unknown }).document;
    }
  }
});
