import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a verification build run next to `next dev` without sharing its output folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
