import { getOptionalEnv } from "@/system/config/environment";

/**
 * Normalize a public URL path prefix for Next.js `basePath`.
 * Empty / missing → "" (app at domain root).
 * "/some-bullshit/" → "/some-bullshit"
 */
export function normalizeBasePath(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

function getBasePath(): string {
  return normalizeBasePath(getOptionalEnv("NEXT_PUBLIC_BASE_PATH") ?? getOptionalEnv("BASE_PATH"));
}

/** Prefix an app-absolute path (`/api/...`) for fetch/cookie use under `basePath`. */
export function withBasePath(path: string): string {
  const basePath = getBasePath();
  if (!path.startsWith("/")) {
    throw new Error(`withBasePath expects an absolute path, got: ${path}`);
  }
  if (!basePath) {
    return path;
  }
  if (path === "/") {
    return basePath;
  }
  return `${basePath}${path}`;
}

export function getCookiePath(): string {
  return getBasePath() || "/";
}
