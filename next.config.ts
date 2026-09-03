import type { NextConfig } from "next";
import "sass";
import { getOptionalEnv, setEnv } from "@/system/config/environment";
import { normalizeBasePath } from "@/system/config/base-path";

const basePath = normalizeBasePath(getOptionalEnv("BASE_PATH"));

if (basePath) {
  setEnv("NEXT_PUBLIC_BASE_PATH", basePath);
} else {
  setEnv("NEXT_PUBLIC_BASE_PATH", undefined);
}

const nextConfig = {
  ...(basePath ? { basePath } : {}),
  distDir: getOptionalEnv("NEXT_DIST_DIR") ?? ".next",
  sassOptions: {
    includePaths: ["node_modules"],
  },
} satisfies NextConfig;

export default nextConfig;
