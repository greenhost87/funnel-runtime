import type { NextConfig } from "next";
import "sass";
import { getOptionalEnv } from "@/system/config/environment";

const nextConfig = {
  distDir: getOptionalEnv("NEXT_DIST_DIR") ?? ".next",
} satisfies NextConfig;

export default nextConfig;
