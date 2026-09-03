import type { NextConfig } from "next";
import "sass";
import { getOptionalEnv } from "@/system/config/environment";

const nextConfig = {
  distDir: getOptionalEnv("NEXT_DIST_DIR") ?? ".next",
  sassOptions: {
    includePaths: ["node_modules"],
  },
} satisfies NextConfig;

export default nextConfig;
