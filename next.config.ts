import type { NextConfig } from "next";
import "sass";

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
} satisfies NextConfig;

export default nextConfig;
